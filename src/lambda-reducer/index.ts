import { DynamoDB } from "aws-sdk";

import Ajv from "ajv";
import { handleReduceInternal } from "./app";

const ajv = new Ajv({ allErrors: true });

const docClient = new DynamoDB.DocumentClient({
  region: process.env.AWS_DEFAULT_REGION,
});

export const handleReduce = handleReduceInternal({
  docClient,
  eventsTableName: process.env.EVENTS_TABLE_NAME!,
  usersTableName: process.env.USERS_TABLE_NAME!,
  userIdGsiName: process.env.USER_ID_GSI_NAME!,
  ajv,
});
