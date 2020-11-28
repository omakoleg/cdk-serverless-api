import { DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { sortBy } from 'lodash';
import { ErrorObject } from 'ajv';
import schema from './user-schema.json';
import { User } from '../shared/types/user';
import { Event } from '../shared/types/event';
import { ReducerLambdaConfig } from './types';

export const loadEventsByUserId = async (
  docClient: DynamoDB.DocumentClient,
  eventsTableName: string,
  indexName: string,
  userId: string,
): Promise<Event[]> => {
  const result = await docClient
    .query({
      TableName: eventsTableName,
      IndexName: indexName,
      KeyConditionExpression: '#userId = :userId',
      ExpressionAttributeNames: {
        '#userId': 'userId',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    })
    .promise();
  return result ? (result.Items || []).map((i) => i as Event) : [];
};

const saveUser = async (docClient: DynamoDB.DocumentClient, usersTableName: string, user: User): Promise<void> =>
  await docClient
    .put({
      TableName: usersTableName,
      Item: user,
    })
    .promise()
    .then();

export const reduceUserEvents = (events: Event[]): Partial<User> =>
  events.reduce((acc: Partial<User>, c: Event) => {
    const result = {
      ...acc,
      userId: c.userId,
      balance: (acc.balance || 0) + (c.amount || 0) - (c.transaction || 0),
      name: c.name || acc.name,
      email: c.email || acc.email,
    };
    return result;
  }, {} as Partial<User>);

const toErrors = (errors: ErrorObject[]): string[] => errors.map((x) => `${x.dataPath} ${x.message}`);

export const generateUser = async (userId: string, config: ReducerLambdaConfig): Promise<string> => {
  const { docClient, eventsTableName, userIdGsiName, usersTableName, ajv } = config;
  const combinedEvents = await loadEventsByUserId(docClient, eventsTableName, userIdGsiName, userId);
  const events = sortBy(combinedEvents, (x) => new Date(x.createdAt).getTime());
  const maybeUser = reduceUserEvents(events);
  const validate = ajv.compile(schema);
  if (validate(maybeUser)) {
    await saveUser(docClient, usersTableName, maybeUser as User);
    return `User saved: ${JSON.stringify(maybeUser)}`;
  } else {
    return `Skip. Cant assemble valid user: ${JSON.stringify(maybeUser)} due: ${toErrors(validate.errors || [])}`;
  }
};

export const handleReduceInternal = (config: ReducerLambdaConfig) => async (
  event: DynamoDBStreamEvent,
): Promise<string> => {
  const record = event.Records[0];
  if (record.eventName !== 'INSERT') {
    return `Skipped. Due to ${record.eventName}`;
  }
  const decodedEvent = DynamoDB.Converter.unmarshall(record.dynamodb?.NewImage || {}) as Event;
  if (!decodedEvent.userId) {
    return `Skipped. Broken Event: ${JSON.stringify(decodedEvent)}`;
  }
  return await generateUser(decodedEvent.userId, config);
};
