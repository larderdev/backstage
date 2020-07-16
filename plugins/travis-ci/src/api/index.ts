/*
 * Copyright 2020 Spotify AB
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

import { createApiRef } from '@backstage/core';
import { BASE_URL } from './constants';

export const travisCIApiRef = createApiRef<TravisCIApi>({
  id: 'plugin.travisci.service',
  description: 'Used by the TravisCI plugin to make requests',
});

export class TravisCIApi {
  apiUrl: string;
  constructor(apiUrl: string = '/travisci/api') {
    this.apiUrl = apiUrl;
  }

  async retry(buildNumber: number, options: any) {
    // return postBuildActions(options.token, buildNumber, BuildAction.RETRY, {
    //   circleHost: this.apiUrl,
    //   ...options.vcs,
    // });
  }

  async getBuilds(
    {
      limit = 10,
      offset = 0,
    }: {
      limit: number;
      offset: number;
    },
    { token, owner, repo }: { token: string; owner: string; repo: string }, // options: CircleCIOptions,
  ) {
    const repoSlug = encodeURIComponent(`${owner}/${repo}`);

    const response = await (
      await fetch(
        `${BASE_URL}repo/${repoSlug}/builds?offset=${offset}&limit=${limit}`,
        {
          // @ts-ignore
          headers: {
            Authorization: `token ${token}`,
            'Travis-API-Version': '3',
          },
        },
      )
    ).json();

    return response.builds;
  }

  // return getBuildSummaries(options.token, {
  //   options: {
  //     limit,
  //     offset,
  //   },
  //   vcs: {},
  //   circleHost: this.apiUrl,
  //   ...options,
  // });

  // async getUser(options: CircleCIOptions) {
  //   return getMe(options.token, { circleHost: this.apiUrl, ...options });
  // }

  async getBuild(buildNumber: number, options: any) {
    // return getFullBuild(options.token, buildNumber, {
    //   circleHost: this.apiUrl,
    //   ...options.vcs,
    // });
  }
}
