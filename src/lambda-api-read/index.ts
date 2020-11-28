import { DynamoDB } from 'aws-sdk';
import { USERS_TABLE_NAME } from '../../lib/names';
import { handleReadInternal } from './app';

const docClient = new DynamoDB.DocumentClient({
  region: process.env.AWS_DEFAULT_REGION,
});

export const handleRead = handleReadInternal(docClient, USERS_TABLE_NAME);
