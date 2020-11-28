import { handleReduceInternal, generateUser, reduceUserEvents } from '../../src/lambda-reducer/app';
import { Event } from '../../src/shared/types/event';
import Ajv from 'ajv';
import { getMockDynamoDB } from '../helpers/mock-dynamodb';
import { ReducerLambdaConfig } from '../../src/lambda-reducer/types';

const dummyConfig: Omit<ReducerLambdaConfig, 'docClient'> = {
  eventsTableName: 'e-t',
  usersTableName: 'u-t',
  userIdGsiName: 'u-i',
  ajv: new Ajv({ allErrors: true }),
};

describe('.reduceUserEvents', () => {
  it('Reduces events in order', () => {
    const userEvent: Event = {
      eventId: '1',
      createdAt: 'x',
      userId: '1',
      name: 'name',
      email: 'email-1',
    };
    const amountPositiveEvent: Event = {
      eventId: '2',
      createdAt: 'x',
      userId: '1',
      amount: 500,
    };
    const amountNegativeEvent: Event = {
      eventId: '3',
      createdAt: 'x',
      userId: '1',
      amount: -80,
    };
    const transactionEvent: Event = {
      eventId: '4',
      createdAt: 'x',
      userId: '1',
      transaction: 50,
    };
    const userUpdateEvent: Event = {
      eventId: '5',
      createdAt: 'x',
      userId: '1',
      name: 'name-2',
      email: 'email',
    };
    const result = reduceUserEvents([
      userEvent,
      amountPositiveEvent,
      amountNegativeEvent,
      transactionEvent,
      userUpdateEvent,
    ]);
    expect(result).toEqual({
      userId: '1',
      name: 'name-2',
      email: 'email',
      balance: 370, // 500 -80 -50
    });
  });

  it('keeps previous user data', () => {
    const userEvent: Event = {
      eventId: '1',
      createdAt: 'x',
      userId: '1',
      name: 'name',
      email: 'email-1',
    };
    const amountPositiveEvent: Event = {
      eventId: '2',
      createdAt: 'x',
      userId: '1',
      amount: 500,
    };
    const result = reduceUserEvents([userEvent, amountPositiveEvent]);
    expect(result).toEqual({
      userId: '1',
      name: 'name',
      email: 'email-1',
      balance: 500,
    });
  });
});

describe('.handleReduceInternal', () => {
  it('REMOVE is skipped', async () => {
    const { docClient, getParams, putParams } = getMockDynamoDB({});
    const result = await handleReduceInternal({
      docClient,
      ...dummyConfig,
    })({
      Records: [
        {
          eventName: 'REMOVE',
        },
      ],
    });
    expect(getParams).toHaveLength(0);
    expect(putParams).toHaveLength(0);
    expect(result).toBe('Skipped. Due to REMOVE');
  });
  it('MODIFY is skipped', async () => {
    const { docClient, getParams, putParams } = getMockDynamoDB({});
    const result = await handleReduceInternal({
      docClient,
      ...dummyConfig,
    })({
      Records: [
        {
          eventName: 'MODIFY',
        },
      ],
    });
    expect(getParams).toHaveLength(0);
    expect(putParams).toHaveLength(0);
    expect(result).toBe('Skipped. Due to MODIFY');
  });

  it('Skip events without userId', async () => {
    const { docClient } = getMockDynamoDB({});
    const result = await handleReduceInternal({
      docClient,
      ...dummyConfig,
    })({
      Records: [
        {
          eventName: 'INSERT',
          dynamodb: {
            NewImage: {
              test: {
                S: '1',
              },
            },
          },
        },
      ],
    });
    expect(result).toBe('Skipped. Broken Event: {"test":"1"}');
  });
});

describe('.generateUser', () => {
  it('No users in database', async () => {
    const { docClient, queryParams } = getMockDynamoDB({
      queryOutput: {
        Items: [],
      },
    });
    await generateUser('1', {
      docClient,
      ...dummyConfig,
    });
    expect(queryParams).toEqual([
      {
        ExpressionAttributeNames: {
          '#userId': 'userId',
        },
        ExpressionAttributeValues: {
          ':userId': '1',
        },
        IndexName: 'u-i',
        KeyConditionExpression: '#userId = :userId',
        TableName: 'e-t',
      },
    ]);
  });

  it('Order and reduce user events', async () => {
    const { docClient, putParams } = getMockDynamoDB({
      queryOutput: {
        Items: [
          {
            eventId: 'a',
            createdAt: new Date('2020-01-02').toISOString(),
            userId: '1',
            name: 'a-user',
            email: 'a@email.de',
          },
          {
            eventId: 'b',
            createdAt: new Date('2020-01-01').toISOString(),
            userId: '1',
            name: 'b-user',
            email: 'b@email.de',
          },
        ],
      },
      putOutput: {},
    });
    const result = await generateUser('1', {
      docClient,
      ...dummyConfig,
    });
    expect(result).toBe('User saved: {"userId":"1","balance":0,"name":"a-user","email":"a@email.de"}');
    // Data is based on latest (2020-01-02) "a" event
    expect(putParams).toEqual([
      {
        Item: {
          balance: 0,
          email: 'a@email.de',
          name: 'a-user',
          userId: '1',
        },
        TableName: 'u-t',
      },
    ]);
  });

  it("Amount changing events can't create valid user", async () => {
    const { docClient, putParams } = getMockDynamoDB({
      queryOutput: {
        Items: [
          {
            eventId: 'a',
            createdAt: new Date('2020-01-02').toISOString(),
            userId: '1',
            balance: 100,
          },
          {
            eventId: 'b',
            createdAt: new Date('2020-01-01').toISOString(),
            userId: '1',
            transaction: -10,
          },
        ],
      },
      putOutput: {},
    });
    const result = await generateUser('1', {
      docClient,
      ...dummyConfig,
    });
    expect(result).toBe(
      'Skip. Cant assemble valid user: {"userId":"1","balance":10} ' +
        "due:  should have required property 'name', should have required property 'email'",
    );
    expect(putParams).toHaveLength(0);
  });

  it('Not valid user is skipped', async () => {
    const { docClient, putParams } = getMockDynamoDB({
      queryOutput: {
        Items: [
          {
            eventId: 'a',
            createdAt: new Date('2020-01-02').toISOString(),
            userId: '1',
            name: '',
            email: 'not an email format',
          },
        ],
      },
      putOutput: {},
    });
    const result = await generateUser('1', {
      docClient,
      ...dummyConfig,
    });
    expect(result).toBe(
      'Skip. Cant assemble valid user: {"userId":"1","balance":0,"email":"not an email format"} due:  should have required property \'name\',.email should match format "email"',
    );
    expect(putParams).toHaveLength(0);
  });
});
