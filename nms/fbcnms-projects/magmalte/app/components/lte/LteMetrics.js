/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {MetricGraphConfig} from '../insights/Metrics';

import AppBar from '@material-ui/core/AppBar';
import AppContext from '@fbcnms/ui/context/AppContext';
import Metrics from '../insights/Metrics';
import NestedRouteLink from '@fbcnms/ui/components/NestedRouteLink';
import NetworkKPIs from './NetworkKPIs';
import React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import {Redirect, Route, Switch} from 'react-router-dom';
import {findIndex} from 'lodash';
import {makeStyles} from '@material-ui/styles';
import {useFeatureFlag, useRouter} from '@fbcnms/ui/hooks';

const useStyles = makeStyles(theme => ({
  bar: {
    backgroundColor: theme.palette.blueGrayDark,
  },
  tabs: {
    flex: 1,
    color: 'white',
  },
}));

const CONFIGS: Array<MetricGraphConfig> = [
  {
    basicQueryConfigs: [
      {
        metric: 'enodeb_rf_tx_enabled',
        filters: [{name: 'service', value: 'enodebd'}],
      },
    ],
    label: 'E-Node B Status',
  },
  {
    basicQueryConfigs: [
      {
        metric: 'ue_connected',
        filters: [{name: 'service', value: 'mme'}],
      },
    ],
    label: 'Connected Subscribers',
  },
  {
    customQueryConfigs: [
      {
        resolvePrometheusQuery: gw =>
          `pdcp_user_plane_bytes_dl{gatewayID="${gw}", service="enodebd"}/1000`,
        resolveGraphiteQuery: _ => '',
      },
    ],
    basicQueryConfigs: [],
    label: 'Download Throughput',
    unit: ' Mbps',
  },
  {
    customQueryConfigs: [
      {
        resolvePrometheusQuery: gw =>
          `pdcp_user_plane_bytes_ul{gatewayID="${gw}", service="enodebd"}/1000`,
        resolveGraphiteQuery: _ => '',
      },
    ],
    basicQueryConfigs: [],
    label: 'Upload Throughput',
    unit: ' Mbps',
  },
  {
    basicQueryConfigs: [
      {
        metric: 'magmad_ping_rtt_ms',
        filters: [
          {name: 'service', value: 'magmad'},
          {name: 'metric', value: 'rtt_ms'},
        ],
      },
    ],
    label: 'Latency',
    unit: ' ms',
  },
  {
    basicQueryConfigs: [
      {
        metric: 'cpu_percent',
        filters: [{name: 'service', value: 'magmad'}],
      },
    ],
    label: 'Gateway CPU (%)',
    unit: '%',
  },
  {
    basicQueryConfigs: [
      {
        metric: 'temperature',
        filters: [{name: 'service', value: 'magmad'}],
      },
    ],
    label: 'Temperature (℃)',
    unit: '℃',
  },
  {
    basicQueryConfigs: [
      {
        metric: 'disk_percent',
        filters: [{name: 'service', value: 'magmad'}],
      },
    ],
    label: 'Disk (%)',
    unit: '%',
  },
  {
    basicQueryConfigs: [
      {
        metric: 's6a_auth_success',
        filters: [{name: 'service', value: 'subscriberdb'}],
      },
    ],
    label: 's6a Auth Success',
    unit: '',
  },
  {
    basicQueryConfigs: [
      {
        metric: 's6a_auth_failure',
        filters: [{name: 'service', value: 'subscriberdb'}],
      },
    ],
    label: 's6a Auth Failure',
    unit: '',
  },
];

const INTERNAL_CONFIGS: Array<MetricGraphConfig> = [
  {
    label: 'Memory Utilization',
    basicQueryConfigs: [],
    filters: [],
    unit: '',
    customQueryConfigs: [
      {
        resolvePrometheusQuery: gid =>
          `mem_free{gatewayID="${gid}"} / mem_total{gatewayID="${gid}"}`,
        resolveGraphiteQuery: gid =>
          `divideSeries(` +
          `seriesByTag('name=mem_free', 'gatewayID=${gid}'),` +
          `seriesByTag('name=mem_total', 'gatewayID=${gid}')` +
          `)`,
      },
    ],
  },
  {
    label: 'Temperature',
    basicQueryConfigs: [
      {
        metric: 'temperature',
        filters: [
          {name: 'service', value: 'magmad'},
          {name: 'sensor', value: 'coretemp_0'},
        ],
      },
    ],
    unit: 'C',
  },
  {
    label: 'Virtual Memory',
    basicQueryConfigs: [
      {
        metric: 'virtual_memory_percent',
        filters: [{name: 'service', value: 'magmad'}],
      },
    ],
    unit: '%',
  },
  {
    label: 'Backhaul Latency',
    basicQueryConfigs: [
      {
        metric: 'magmad_ping_rtt_ms',
        filters: [
          {name: 'service', value: 'magmad'},
          {name: 'host', value: '8.8.8.8'},
          {name: 'metric', value: 'rtt_ms'},
        ],
      },
    ],
    unit: 'ms',
  },
  {
    label: 'System Uptime',
    basicQueryConfigs: [
      {
        metric: 'process_uptime_seconds',
        filters: [{name: 'service', value: 'magmad'}],
      },
    ],
    unit: 's',
  },
  {
    label: 'Number of Service Restarts',
    basicQueryConfigs: [
      {
        metric: 'unexpected_service_restarts',
        filters: [{name: 'service', value: 'magmad'}],
      },
    ],
    unit: 's',
  },
];

function GatewayMetrics() {
  return <Metrics configs={CONFIGS} />;
}

function InternalMetrics() {
  return <Metrics configs={INTERNAL_CONFIGS} />;
}

export default function() {
  const lteNetworkMetrics = useFeatureFlag(AppContext, 'lte_network_metrics');
  if (!lteNetworkMetrics) {
    return <GatewayMetrics />;
  }

  const classes = useStyles();
  const {match, relativePath, relativeUrl, location} = useRouter();

  const currentTab = findIndex(['gateways', 'network', 'internal'], route =>
    location.pathname.startsWith(match.url + '/' + route),
  );

  return (
    <>
      <AppBar position="static" color="default" className={classes.bar}>
        <Tabs
          value={currentTab !== -1 ? currentTab : 0}
          indicatorColor="primary"
          textColor="inherit"
          className={classes.tabs}>
          <Tab component={NestedRouteLink} label="Gateways" to="/gateways" />
          <Tab component={NestedRouteLink} label="Network" to="/network" />
          <Tab component={NestedRouteLink} label="Internal" to="/internal" />
        </Tabs>
      </AppBar>
      <Switch>
        <Route path={relativePath('/gateways')} component={GatewayMetrics} />
        <Route path={relativePath('/network')} component={NetworkKPIs} />
        <Route path={relativePath('/internal')} component={InternalMetrics} />
        <Redirect to={relativeUrl('/gateways')} />
      </Switch>
    </>
  );
}
