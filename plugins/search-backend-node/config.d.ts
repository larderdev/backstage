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

export interface Config {
  /** Configuration options for the search plugin */
  search?: {
    /**
     * Search engine to use. Defaults to Lunr inmemory search engine
     */
    engine?: 'Lunr' | 'ElasticSearch';

    /**
     * Additional options for ElasticSearch if selected search engine is ES
     */
    elasticSearch?: {
      /**
       * (Required). ElasticSearch provider.
       * Possible values:
       *  - Elastic = elastic.co
       *  - AWS = Amazon Elasticsearch Service
       *  - Custom = self-hosted/other
       */
      provider: 'elastic' | 'aws' | 'custom';

      /**
       * (Required) Node configuration.
       * URL/URLS to ElasticSearch node to connect to.
       * Either direct URL like 'https://localhost:9200' or with credentials like 'https://username:password@localhost:9200'
       */
      node: string | string[];

      /**
       * (Required for Elastic provider) Elastic.co CloudId
       * Used to generate connection to elastic.co hosted ElasticSearch cluster
       */
      cloudId?: string;

      /**
       * (Required for custom/elastic providers) Authentication credentials for ElasticSearch
       * If both ApiKey/Bearer token and username+password is provided, tokens take precedence
       */
      auth?: {
        username?: string;

        /**
         * @visibility secret
         */
        password?: string;
        /**
         * @visibility secret
         * Base64 Encoded API key to be used to connect to the cluster.
         * See: https://www.elastic.co/guide/en/elasticsearch/reference/7.x/security-api-create-api-key.html
         */
        apiKey?: string;
        /**
         * @visibility secret
         * Bearer token authentication token to connect to the cluster.
         * See: https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-create-service-token.html
         */
        bearer?: string;
      };
    };
  };
}
