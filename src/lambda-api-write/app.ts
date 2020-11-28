import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { v4 } from 'uuid';
import { Ajv } from 'ajv';
import schema from './request-schema.json';
import { toResponse } from '../shared/to-response';
import { Event } from '../shared/types/event';

const DefaultCurrentTime = () => new Date().toISOString();
const DefaultId = () => v4();

const saveRequest = (
  docClient: DynamoDB.DocumentClient,
  eventsTableName: string,
  data: Event,
  getCurrentTime: () => string,
  getId: () => string,
): Promise<void> =>
  docClient
    .put({
      TableName: eventsTableName,
      Item: {
        ...data,
        eventId: getId(),
        createdAt: getCurrentTime(),
      },
    })
    .promise()
    .then();

export const handleWriteInternal = (
  docClient: DynamoDB.DocumentClient,
  ajv: Ajv,
  eventsTableName: string,
  getCurrentTime: () => string = DefaultCurrentTime,
  getId: () => string = DefaultId,
) => async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(`Request: ${JSON.stringify(event)}`);
  if (!event.body) {
    return toResponse(400, ['Request body is not provided']);
  }
  let errors: string[] = [];
  try {
    const body = JSON.parse(event.body);
    const validate = ajv.compile(schema);
    const isValid = validate(body);
    if (isValid) {
      await saveRequest(docClient, eventsTableName, body as Event, getCurrentTime, getId);
      return toResponse(200);
    }
    errors = (validate.errors || []).map((x) => `${x.dataPath} ${x.message}`);
  } catch (e) {
    console.log(`Processing error: ${e}`);
    errors = [e.toString()];
  }
  return toResponse(400, errors);
};
