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
import { SearchEngine } from '../types';
import esb from 'elastic-builder';
import { Client } from '@elastic/elasticsearch';
import { Config } from '@backstage/config';
import {
  createAWSConnection,
  awsGetCredentials,
} from '@acuris/aws-es-connection';

export type ConcreteElasticSearchQuery = {
  documentFields?: string[];
  elasticQueryBuilder: () => any;
};

type ElasticConfigAuth = {
  username: string;
  password: string;
  apiKey: string;
  bearer: string;
};

type ElasticSearchQueryTranslator = (
  query: SearchQuery,
) => ConcreteElasticSearchQuery;

type ElasticSearchOptions = {
  logger: Logger;
  config: Config;
  aliasPostfix?: string;
};

type ElasticSearchResult = {
  _index: string;
  _type: string;
  _score: number;
  _source: IndexableDocument;
};

export class ElasticSearchSearchEngine implements SearchEngine {
  private documentTypes: Record<string, IndexableDocument> = {};

  constructor(
    private readonly aliasPostfix: string,
    private readonly elasticSearchClient: Client,
    private readonly logger: Logger,
  ) {}

  static async initialize({
    logger,
    config,
    aliasPostfix = `search`,
  }: ElasticSearchOptions) {
    logger.info('Initializing ElasticSearch search engine.');
    return new ElasticSearchSearchEngine(
      `__${aliasPostfix}`,
      await ElasticSearchSearchEngine.constructElasticSearchClient(
        config.getConfig('search.elasticSearch'),
      ),
      logger,
    );
  }

  private static async constructElasticSearchClient(config?: Config) {
    if (!config) {
      throw new Error('No elastic search config found');
    }

    if (config.getOptionalString('provider') === 'custom') {
      return new Client({
        node: config.getString('node'),
        auth: config.get<ElasticConfigAuth>('auth'),
      });
    }
    if (config.getOptionalString('provider') === 'elastic') {
      return new Client({
        cloud: {
          id: config.getString('cloudId'),
        },
        auth: config.get<ElasticConfigAuth>('auth'),
      });
    }
    if (config.getOptionalString('provider') === 'aws') {
      const awsCredentials = await awsGetCredentials();
      const AWSConnection = createAWSConnection(awsCredentials);
      return new Client({
        node: config.getString('node'),
        ...AWSConnection,
      });
    }
    throw new Error('Failed to initialize ElasticSearch client');
  }

  protected translator({
    term,
    filters,
    types,
  }: SearchQuery): ConcreteElasticSearchQuery {
    const searchableFields = [
      ...new Set(
        types
          ? types.flatMap(it => {
              if (!this.documentTypes[it]) return [];
              return Object.keys(this.documentTypes[it]).map(key => key);
            })
          : Object.values(this.documentTypes).flatMap(it =>
              Object.keys(it).map(key => key),
            ),
      ),
    ];
    return {
      elasticQueryBuilder: () => {
        return esb
          .requestBodySearch()
          .query(
            esb
              .multiMatchQuery(searchableFields, term)
              .fuzziness('auto')
              .minimumShouldMatch(1),
          );
      },
      documentFields: searchableFields,
    };
  }

  setTranslator(translator: ElasticSearchQueryTranslator) {
    this.translator = translator;
  }

  async index(type: string, documents: IndexableDocument[]): Promise<void> {
    this.logger.info(
      `Started indexing ${documents.length} documents for index ${type}`,
    );
    console.time(`indexing ${type}`);
    const alias = `${type}${this.aliasPostfix}`;
    const aliases = await this.elasticSearchClient.cat.aliases({
      format: 'json',
      name: alias,
    });
    const removableIndices = aliases.body.map(
      (r: Record<string, any>) => r.index,
    );
    const timestamp = Date.now();

    const index = `${type}-index__${timestamp}`;

    await this.elasticSearchClient.indices.create({
      index,
    });
    const result = await this.elasticSearchClient.helpers.bulk({
      datasource: documents,
      onDocument() {
        return {
          index: { _index: index },
        };
      },
      refreshOnCompletion: index,
    });

    this.documentTypes[type] = documents[0];
    this.logger.info(`Indexing completed for index ${type}`, result);
    console.timeEnd(`indexing ${type}`);
    await this.elasticSearchClient.indices.updateAliases({
      body: {
        actions: [
          { remove: { index: `${type}-index__*`, alias } },
          { add: { index, alias } },
        ],
      },
    });

    this.logger.info('Removing stale search indices', removableIndices);
    await this.elasticSearchClient.indices.delete({ index: removableIndices });
  }

  async query(query: SearchQuery): Promise<SearchResultSet> {
    const { elasticQueryBuilder } = this.translator(
      query,
    ) as ConcreteElasticSearchQuery;

    const requestBody = elasticQueryBuilder();

    const queryIndices = query.types
      ? query.types.map(it => `${it}${this.aliasPostfix}`)
      : `*${this.aliasPostfix}`;
    const body = requestBody.toJSON();
    const result = await this.elasticSearchClient.search({
      index: queryIndices,
      body,
    });
    return {
      results: result.body.hits.hits.map((d: ElasticSearchResult) => ({
        type: d._index.split('__')[0],
        document: d._source,
      })),
    };
  }
}
