import { join } from 'path';
import * as cdk from '@aws-cdk/core';
import { RestApi, LambdaIntegration, TokenAuthorizer } from '@aws-cdk/aws-apigateway';
import { RetentionDays } from '@aws-cdk/aws-logs';
import { Runtime, Tracing } from '@aws-cdk/aws-lambda';
import { Table } from '@aws-cdk/aws-dynamodb';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Duration } from '@aws-cdk/core';

export interface ApiStackProps extends cdk.StackProps {
  eventsTable: Table;
  usersTable: Table;
  authTable: Table;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);
    const { eventsTable, usersTable, authTable } = props;

    /** Read handler and permissions */
    const readLambda = new NodejsFunction(this, 'ReadLambda', {
      functionName: 'read-api',
      entry: join(__dirname, '..', 'src', 'lambda-api-read', 'index.ts'),
      runtime: Runtime.NODEJS_12_X,
      handler: 'handleRead',
      tracing: Tracing.ACTIVE,
      logRetention: RetentionDays.ONE_DAY,
      environment: {
        VERSION: new Date().toISOString(),
      },
    });
    usersTable.grantReadData(readLambda);
    /** Write handler and permissions */
    const writeLambda = new NodejsFunction(this, 'WriteLambda', {
      functionName: 'write-api',
      entry: join(__dirname, '..', 'src', 'lambda-api-write', 'index.ts'),
      runtime: Runtime.NODEJS_12_X,
      handler: 'handleWrite',
      tracing: Tracing.ACTIVE,
      logRetention: RetentionDays.ONE_DAY,
      environment: {
        VERSION: new Date().toISOString(),
      },
    });
    eventsTable.grantWriteData(writeLambda);
    /** Auth handler and permissions */
    const authLambda = new NodejsFunction(this, 'AuthLambda', {
      functionName: 'auth',
      entry: join(__dirname, '..', 'src', 'lambda-auth', 'index.ts'),
      runtime: Runtime.NODEJS_12_X,
      handler: 'handleAuth',
      tracing: Tracing.ACTIVE,
      logRetention: RetentionDays.ONE_DAY,
      environment: {
        VERSION: new Date().toISOString(),
      },
    });
    authTable.grantReadData(authLambda);
    /** API */
    const api = new RestApi(this, 'Api', {
      restApiName: 'api',
      deployOptions: { metricsEnabled: true, tracingEnabled: true },
    });
    /** API Auth */
    const authorizer = new TokenAuthorizer(this, 'RequestAuthorizer', {
      handler: authLambda,
      resultsCacheTtl: Duration.seconds(5),
    });
    /** Write API */
    const writeApiIntegration = new LambdaIntegration(writeLambda);
    api.root.resourceForPath('/write').addMethod('POST', writeApiIntegration, {
      authorizer,
    });
    /** Read API */
    const readApiIntegration = new LambdaIntegration(readLambda);
    api.root.resourceForPath('/user').addMethod('GET', readApiIntegration, {
      authorizer,
    });
  }
}
