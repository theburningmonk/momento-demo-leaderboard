#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { LeaderboardApiStack } = require('./constructs/leaderboard-api-stack');

const app = new cdk.App();

let stageName = app.node.tryGetContext('stageName');
let ssmStageName = app.node.tryGetContext('ssmStageName');

if (!stageName) {
  console.log('Defaulting stage name to dev');
  stageName = 'dev';
}

if (!ssmStageName) {
  console.log(`Defaulting SSM stage name to "stageName": ${stageName}`);
  ssmStageName = stageName;
}

const serviceName = 'leaderboard-api';

new LeaderboardApiStack(app, `LeaderboardApiStack-${stageName}`, {
  serviceName,
  stageName,
  ssmStageName,
});
