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
import React, { FC } from 'react';
import { Typography, Box, IconButton } from '@material-ui/core';
import RetryIcon from '@material-ui/icons/Replay';
import GitHubIcon from '@material-ui/icons/GitHub';
import {
  StatusError,
  StatusWarning,
  StatusOK,
  StatusPending,
  StatusRunning,
  Table,
  TableColumn,
} from '@backstage/core';
import formatDistance from 'date-fns/formatDistance';

export type CITableBuildInfo = {
  id: string;
  buildName: string;
  buildUrl?: string;
  finishedAt: string;
  duration: number;
  source: {
    branchName: string;
    commit: {
      hash: string;
      url: string;
    };
  };
  status: string;
  tests?: {
    total: number;
    passed: number;
    skipped: number;
    failed: number;
    testUrl: string;
  };
  onRestartClick: () => void;
};

const getStatusComponent = (status: string | undefined = '') => {
  switch (status.toLowerCase()) {
    case 'queued':
    case 'created':
      return <StatusPending />;
    case 'started':
      return <StatusRunning />;
    case 'failed':
      return <StatusError />;
    case 'passed':
      return <StatusOK />;
    case 'canceled':
    default:
      return <StatusWarning />;
  }
};

const generatedColumns: TableColumn[] = [
  {
    title: 'ID',
    field: 'id',
    type: 'numeric',
    width: '80px',
  },
  {
    title: 'Build',
    field: 'buildName',
    highlight: true,
    render: (row: Partial<CITableBuildInfo>) => (
      <a href={row.buildUrl} target="_blank">
        {row.buildName}
      </a>
    ),
  },
  {
    title: 'Source',
    render: (row: Partial<CITableBuildInfo>) => (
      <>
        <p>{row.source?.branchName}</p>
        <p>{row.source?.commit.hash}</p>
      </>
    ),
    sorting: false,
  },
  {
    title: 'Status',
    render: (row: Partial<CITableBuildInfo>) => (
      <Box display="flex" alignItems="center">
        {getStatusComponent(row.status)}
        <Box mr={1} />
        <Typography variant="button">{row.status}</Typography>
      </Box>
    ),
    sorting: false,
  },
  {
    title: 'Date',
    render: (row: Partial<CITableBuildInfo>) => {
      return (
        <>
          <p>{formatDistance(new Date(), new Date(row.finishedAt!))} ago</p>
          <p>{row.duration} sec</p>
        </>
      );
    },
  },
  {
    title: 'Actions',
    render: (row: Partial<CITableBuildInfo>) => (
      <IconButton onClick={row.onRestartClick}>
        <RetryIcon />
      </IconButton>
    ),
    width: '10%',
    sorting: false,
  },
];

type Props = {
  loading: boolean;
  retry: () => void;
  builds: CITableBuildInfo[];
  projectName: string;
  page: number;
  onChangePage: (page: number) => void;
  total: number;
  pageSize: number;
  onChangePageSize: (pageSize: number) => void;
};

export const CITable: FC<Props> = ({
  projectName,
  loading,
  pageSize,
  page,
  retry,
  builds,
  onChangePage,
  onChangePageSize,
  total,
}) => {
  return (
    <>
      <Table
        isLoading={loading}
        options={{ paging: true, pageSize }}
        totalCount={total}
        page={page}
        actions={[
          {
            icon: () => <RetryIcon />,
            tooltip: 'Refresh Data',
            isFreeAction: true,
            onClick: retry,
          },
        ]}
        data={builds}
        onChangePage={onChangePage}
        onChangeRowsPerPage={onChangePageSize}
        title={
          <Box display="flex" alignItems="center">
            <GitHubIcon />
            <Box mr={1} />
            <Typography variant="h6">{projectName}</Typography>
          </Box>
        }
        columns={generatedColumns}
      />
    </>
  );
};
