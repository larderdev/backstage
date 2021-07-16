/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  IndexableDocument,
  SearchQuery,
  SearchResultSet,
} from '@backstage/search-common';
import { Logger } from 'winston';
import { QueryTranslator, SearchEngine } from '../types';
import esb from 'elastic-builder';
import { Client } from '@elastic/elasticsearch';
import { Config } from '@backstage/config';
import { createConnector } from 'aws-elasticsearch-js';

export type ConcreteElasticSearchQuery = {
  documentTypes?: string[];
  elasticQueryBuilder: () => any;
};

type ElasticConfigAuth = {
  username?: string;
  password?: string;
  apiKey?: string;
  bearer?: string;
};

type ElasticSearchQueryTranslator = (
  query: SearchQuery,
) => ConcreteElasticSearchQuery;

type ElasticSearchOptions = { logger: Logger; config: Config };

export class ElasticSearchSearchEngine implements SearchEngine {
  private readonly ALIAS_POSTFIX = `__search`;
  private documentTypes: Record<string, IndexableDocument> = {};

  private readonly elasticSearchClient: Client;
  protected logger: Logger;

  constructor({ logger, config }: ElasticSearchOptions) {
    this.logger = logger;
    this.elasticSearchClient = ElasticSearchSearchEngine.constructElasticSearchClient(
      config.getConfig('search.elasticSearch'),
    );
  }

  private static constructElasticSearchClient(config?: Config) {
    if (!config) {
      throw new Error('No elastic search config found');
    }

    if (config.getOptionalString('node')) {
      return new Client({
        node: config.getOptionalString('node'),
        auth: config.get<ElasticConfigAuth>('auth'),
      });
    }
    if (config.getOptionalString('cloudId')) {
      return new Client({
        cloud: {
          id: config.getString('cloudId'),
        },
        auth: config.get<ElasticConfigAuth>('auth'),
      });
    }
  }

  protected translator: QueryTranslator = ({
    term,
    filters,
    types,
  }: SearchQuery): ConcreteElasticSearchQuery => {
    return {
      elasticQueryBuilder: () => {
        const searchableFields = [
          ...new Set(
            types
              ? types.flatMap(it =>
                  Object.keys(this.documentTypes[it]).map(key => key),
                )
              : Object.values(this.documentTypes).flatMap(it =>
                  Object.keys(it).map(key => key),
                ),
          ),
        ];

        console.log(searchableFields);

        return esb
          .multiMatchQuery(searchableFields, term)
          .fuzziness('auto')
          .minimumShouldMatch(1);
      },
      documentTypes: types,
    };
  };

  setTranslator(translator: ElasticSearchQueryTranslator) {
    this.translator = translator;
  }

  async index(type: string, documents: IndexableDocument[]): Promise<void> {
    console.log(this.elasticSearchClient);
    const alias = `${type}${this.ALIAS_POSTFIX}`;
    const aliases = await this.elasticSearchClient.cat.aliases({
      format: 'json',
      name: alias,
    });
    const removableIndices = aliases.body.map(
      (r: Record<string, any>) => r.index,
    );
    const timestamp = Date.now();

    const index = `${type}__${timestamp}`;

    await this.elasticSearchClient.indices.create({
      index,
    });

    const body = documents.flatMap(doc => [{ index: { _index: index } }, doc]);

    const { body: bulkResponse } = await this.elasticSearchClient.bulk({
      refresh: true,
      body,
    });

    if (bulkResponse.errors) {
      const erroredDocuments: any[] = [];
      // The items array has the same order of the dataset we just indexed.
      // The presence of the `error` key indicates that the operation
      // that we did for the document has failed.
      bulkResponse.items.forEach((action: any, i: any) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            // If the status is 429 it means that you can retry the document,
            // otherwise it's very likely a mapping error, and you should
            // fix the document before to try it again.
            status: action[operation].status,
            error: action[operation].error,
            operation: body[i * 2],
            document: body[i * 2 + 1],
          });
        }
      });
      console.log(erroredDocuments);
    }

    await this.elasticSearchClient.indices.updateAliases({
      body: {
        actions: [
          { remove: { index: `${type}__*`, alias } },
          { add: { index, alias } },
        ],
      },
    });

    console.log(removableIndices);
    await this.elasticSearchClient.indices.delete({ index: removableIndices });

    this.documentTypes[type] = documents[0];
  }

  async query(query: SearchQuery): Promise<SearchResultSet> {
    const { documentTypes, elasticQueryBuilder } = this.translator(
      query,
    ) as ConcreteElasticSearchQuery;

    const requestBody = esb.requestBodySearch().query(elasticQueryBuilder());

    const queryIndices = query.types
      ? query.types.map(it => `${it}${this.ALIAS_POSTFIX}`)
      : '*';
    const body = requestBody.toJSON();
    console.log(queryIndices);
    console.log(body);
    const result = await this.elasticSearchClient.search({
      index: queryIndices,
      body,
    });
    return {
      results: result.body.hits.hits.map(d => {
        return {
          type: d._index.split('__')[0],
          document: d._source,
        };
      }),
    };
  }
}
