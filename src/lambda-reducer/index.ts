import { DynamoDB } from "aws-sdk";

import Ajv from "ajv";
import { handleReduceInternal } from "./app";
import {
  EVENTS_TABLE_NAME,
  USERS_TABLE_NAME,
  USER_ID_GSI_NAME,
} from "../../lib/names";

const ajv = new Ajv({ allErrors: true });

const docClient = new DynamoDB.DocumentClient({
  region: process.env.AWS_DEFAULT_REGION,
});

export const handleReduce = handleReduceInternal({
  docClient,
  eventsTableName: EVENTS_TABLE_NAME,
  usersTableName: USERS_TABLE_NAME,
  userIdGsiName: USER_ID_GSI_NAME,
  ajv,
});
