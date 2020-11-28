import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { toResponse } from '../shared/to-response';
import { User } from '../shared/types/user';

const getUser = (
  docClient: DynamoDB.DocumentClient,
  usersTableName: string,
  userId: string,
): Promise<User | undefined> =>
  docClient
    .get({
      TableName: usersTableName,
      Key: {
        userId,
      },
    })
    .promise()
    .then((x) => x.Item as User);

export const handleReadInternal = (docClient: DynamoDB.DocumentClient, usersTableName: string) => async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  if (event.queryStringParameters && event.queryStringParameters.userId) {
    console.log('Queried userId: ' + event.queryStringParameters.userId);
    const user = await getUser(docClient, usersTableName, event.queryStringParameters.userId);
    if (user) {
      return toResponse(200, user);
    }
    return toResponse(404, ['User not found']);
  } else {
    return toResponse(400, ['Query parameter userId is required']);
  }
};
