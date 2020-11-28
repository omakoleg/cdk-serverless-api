import { DynamoDB } from 'aws-sdk';
import Ajv from 'ajv';
import { handleWriteInternal } from './app';
import { EVENTS_TABLE_NAME } from '../../lib/names';

const ajv = new Ajv({ allErrors: true });

const docClient = new DynamoDB.DocumentClient({
  region: process.env.AWS_DEFAULT_REGION,
});

export const handleWrite = handleWriteInternal(docClient, ajv, EVENTS_TABLE_NAME);
