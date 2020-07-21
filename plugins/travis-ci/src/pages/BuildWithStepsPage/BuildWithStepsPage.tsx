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
import React, { FC, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Content, InfoCard, Progress } from '@backstage/core';
import { TravisCIBuildResponse } from '../../api';
import { Grid, Box, Link, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { PluginHeader } from '../../components/PluginHeader';
import { ActionOutput } from './lib/ActionOutput/ActionOutput';
import { Layout } from '../../components/Layout';
import LaunchIcon from '@material-ui/icons/Launch';
import { useSettings } from '../../state/useSettings';
import { useBuild } from '../../state/useBuild';

const IconLink = IconButton as typeof Link;
const BuildName: FC<{ build?: TravisCIBuildResponse }> = ({ build }) => (
  <Box display="flex" alignItems="center">
    #{build?.number} - {build?.['@representation']}
    <IconLink href={build?.['@href']} target="_blank">
      <LaunchIcon />
    </IconLink>
  </Box>
);

const useStyles = makeStyles(theme => ({
  neutral: {},
  failed: {
    position: 'relative',
    '&:after': {
      pointerEvents: 'none',
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      boxShadow: `inset 4px 0px 0px ${theme.palette.error.main}`,
    },
  },
  running: {
    position: 'relative',
    '&:after': {
      pointerEvents: 'none',
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      boxShadow: `inset 4px 0px 0px ${theme.palette.info.main}`,
    },
  },
  cardContent: {
    backgroundColor: theme.palette.background.default,
  },
  success: {
    position: 'relative',
    '&:after': {
      pointerEvents: 'none',
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      boxShadow: `inset 4px 0px 0px ${theme.palette.success.main}`,
    },
  },
}));

const pickClassName = (
  classes: ReturnType<typeof useStyles>,
  build: TravisCIBuildResponse = {} as TravisCIBuildResponse,
) => {
  if (build.number) return classes.failed;
  if (['running', 'queued'].includes(build.state!)) return classes.running;
  if (build.state === 'success') return classes.success;

  return classes.neutral;
};

const Page = () => (
  <Layout>
    <Content>{/* <BuildWithStepsView /> */}</Content>
  </Layout>
);

const Build: FC<{}> = () => {
  const { buildId = '' } = useParams();
  const classes = useStyles();
  const [settings] = useSettings();
  const [{ loading, value }, { startPolling, stopPolling }] = useBuild(
    parseInt(buildId, 10),
  );

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [buildId, settings, startPolling, stopPolling]);

  return (
    <>
      <PluginHeader title="Build info" />

      <Grid container spacing={3} direction="column">
        <Grid item>
          <InfoCard
            className={pickClassName(classes, value)}
            title={<BuildName build={value} />}
            cardClassName={classes.cardContent}
          >
            {loading ? <Progress /> : <BuildsList build={value} />}
          </InfoCard>
        </Grid>
      </Grid>
    </>
  );
};

const BuildsList: FC<{ build?: TravisCIBuildResponse }> = ({ build }) => (
  <Box>{build && build.number}</Box>
);

// const ActionsList: FC<{ actions: BuildStepAction[]; name: string }> = ({
//   actions,
// }) => {
//   const classes = useStyles();
//   return (
//     <>
//       {actions.map((action: BuildStepAction) => (
//         <ActionOutput
//           className={action.failed ? classes.failed : classes.success}
//           action={action}
//           name={action.name}
//           url={action.output_url || ''}
//         />
//       ))}
//     </>
//   );
// };

export default Page;
export { Build };
