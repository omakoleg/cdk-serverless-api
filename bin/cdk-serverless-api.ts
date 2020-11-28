#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ApiStack } from '../lib/api-stack';
import { EventsDatabaseStack } from '../lib/events-database-stack';
import { UserDatabaseStack } from '../lib/user-database-stack';
import { AuthDatabaseStack } from '../lib/auth-database-stack';
import { Environment } from '@aws-cdk/core';
import { LambdaReducerStack } from '../lib/lambda-reducer-stack';

const app = new cdk.App();
const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};
/** Storage resources */
const eventsDatabaseStack = new EventsDatabaseStack(app, 'EventsDatabaseStack', { env, stackName: 'app-events' });
const usersDatabaseStack = new UserDatabaseStack(app, 'UserDatabaseStack', {
  env,
  stackName: 'app-users',
});
const authDatabaseStack = new AuthDatabaseStack(app, 'AuthDatabaseStack', {
  env,
  stackName: 'app-access',
});

/** External interfaces */
new ApiStack(app, 'ApiStack', {
  env,
  eventsTable: eventsDatabaseStack.eventsTable,
  usersTable: usersDatabaseStack.usersTable,
  authTable: authDatabaseStack.authTable,
  stackName: 'app-api',
});

/** Compute */
new LambdaReducerStack(app, 'LambdaReducerStack', {
  env,
  eventsTable: eventsDatabaseStack.eventsTable,
  usersTable: usersDatabaseStack.usersTable,
  stackName: 'app-reducer',
});
