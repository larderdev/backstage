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
import React from 'react';
import { Entity } from '@backstage/catalog-model';
import { InfoCard, Table, TableColumn } from '@backstage/core';
import { Chip } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { useOwnedEntities } from '../../../hooks/useOwnedEntities';
import { EntityLink } from './components/EntityLink';

const generatedColumns: TableColumn<Entity>[] = [
  {
    title: 'Name',
    field: 'metadata.name',
    highlight: true,
    render: (entity: any) => (
      <EntityLink entity={entity}>{entity.metadata.name}</EntityLink>
    ),
  },
  {
    title: 'Owner',
    field: 'spec.owner',
  },
  {
    title: 'Lifecycle',
    field: 'spec.lifecycle',
  },
  {
    title: 'Type',
    field: 'spec.type',
  },
  {
    title: 'Description',
    field: 'metadata.description',
  },
  {
    title: 'Tags',
    field: 'metadata.tags',
    cellStyle: {
      padding: '0px 16px 0px 20px',
    },
    render: (entity: Entity) => (
      <>
        {entity.metadata.tags &&
          entity.metadata.tags.map(t => (
            <Chip
              key={t}
              label={t}
              size="small"
              variant="outlined"
              style={{ marginBottom: '0px' }}
            />
          ))}
      </>
    ),
  },
];

const EntitiesListingTable = ({ entity }: { entity: Entity }) => {
  const { loading, ownedEntities, error } = useOwnedEntities(entity);

  if (error) return <Alert severity="error">Entities not found</Alert>;

  return (
    <Table
      isLoading={loading}
      options={{ paging: true, padding: 'dense' }}
      data={ownedEntities ?? []}
      columns={generatedColumns}
    />
  );
};

export const EntitiesListingCard = ({ entity }: { entity: Entity }) => (
  <InfoCard title="Entities">
    <EntitiesListingTable entity={entity} />
  </InfoCard>
);
