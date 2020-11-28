import { arrayWith, expect as expectCDK, haveResourceLike, objectLike, stringLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { EventsDatabaseStack } from '../../lib/events-database-stack';
import { LambdaReducerStack } from '../../lib/lambda-reducer-stack';
import { UserDatabaseStack } from '../../lib/user-database-stack';

describe('LambdaReducerStack', () => {
  const app = new cdk.App();
  const env = { account: 'abc', region: 'xxx' };
  const { eventsTable } = new EventsDatabaseStack(app, 'E', { env });
  const { usersTable } = new UserDatabaseStack(app, 'U', {
    env,
  });
  const stack = new LambdaReducerStack(app, 'Reducer', {
    env,
    eventsTable,
    usersTable,
  });

  it('Has Lambda', () => {
    expectCDK(stack).to(
      haveResourceLike('AWS::Lambda::Function', {
        Handler: 'index.handleReduce',
        Role: {
          'Fn::GetAtt': [stringLike('ReducerLambdaServiceRole*'), 'Arn'],
        },
        Runtime: 'nodejs12.x',
        FunctionName: 'reducer',
        TracingConfig: {
          Mode: 'Active',
        },
      }),
    );
  });

  it('Granted write to the Users table', () => {
    expectCDK(stack).to(
      haveResourceLike('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: arrayWith(
            objectLike({
              Action: ['dynamodb:BatchWriteItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem'],
              Effect: 'Allow',
              Resource: [
                {
                  'Fn::ImportValue': stringLike('U:ExportsOutputFnGetAttUsersTable*'),
                },
                {
                  Ref: 'AWS::NoValue',
                },
              ],
            }),
          ),
        },
      }),
    );
  });

  it('Granted read from the Events table', () => {
    expectCDK(stack).to(
      haveResourceLike('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: arrayWith(
            objectLike({
              Action: [
                'dynamodb:BatchGetItem',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:Scan',
              ],
              Effect: 'Allow',
              Resource: [
                {
                  'Fn::ImportValue': stringLike('E:ExportsOutputFnGetAttEventsTable*'),
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      {
                        'Fn::ImportValue': stringLike('E:ExportsOutputFnGetAttEventsTable*'),
                      },
                      '/index/*',
                    ],
                  ],
                },
              ],
            }),
          ),
        },
      }),
    );
  });

  it('Connected to the events stream', () => {
    expectCDK(stack).to(
      haveResourceLike('AWS::Lambda::EventSourceMapping', {
        EventSourceArn: {
          'Fn::ImportValue': stringLike('E:ExportsOutputFnGetAttEventsTable*StreamArn*'),
        },
        FunctionName: {
          Ref: stringLike('ReducerLambda*'),
        },
        BatchSize: 1,
        MaximumRetryAttempts: 1,
        StartingPosition: 'TRIM_HORIZON',
      }),
    );
  });
});
