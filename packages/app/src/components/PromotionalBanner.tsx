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
import { makeStyles } from '@material-ui/core';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';

const useStyles = makeStyles(() => ({
  root: {
    background: '#171717',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    // This is designed to align with some backstage components below.
    paddingRight: 24,
    position: 'sticky',
    top: 0,
    zIndex: 101,
  },

  text: {
    color: '#b5b5b5',
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: '1rem',
    lineHeight: '3rem',
  },

  icon: {
    color: '#b5b5b5',
    fontWeight: 'bold',
    verticalAlign: 'middle',
    paddingBottom: 4,
  },
}));

export const PromotionalBanner = () => {
  const classes = useStyles();
  const URL =
    'https://roadie.io/?utm_source=backstage-demo&utm_medium=web&utm_campaign=promotional-banner';

  return (
    <div className={classes.root}>
      <a href={URL} target="_blank" rel="noopener noreferrer">
        <span className={classes.text}>
          Want SaaS Backstage? Check out Roadie.
        </span>
        <span>
          <ExitToAppIcon className={classes.icon} />
        </span>
      </a>
    </div>
  );
};
