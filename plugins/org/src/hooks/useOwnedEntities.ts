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

import { RELATION_OWNED_BY, Entity } from '@backstage/catalog-model';
import { useApi } from '@backstage/core';
import { catalogApiRef } from '@backstage/plugin-catalog';
import { useAsync } from 'react-use';

export const useOwnedEntities = (entity: Entity) => {
  const {
    metadata: { name: groupName },
  } = entity;
  const catalogApi = useApi(catalogApiRef);
  const { loading, error, value } = useAsync(async () => {
    const entitiesList = await catalogApi.getEntities();
    return entitiesList.items.filter(component =>
      component?.relations?.some(
        r => r.type === RELATION_OWNED_BY && r.target.name === groupName,
      ),
    ) as Array<Entity>;
  });

  return {
    loading,
    error,
    ownedEntities: value,
  };
};
