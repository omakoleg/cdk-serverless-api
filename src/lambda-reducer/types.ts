import { DynamoDB } from "aws-sdk";

import { Ajv } from "ajv";

export interface ReducerLambdaConfig {
  docClient: DynamoDB.DocumentClient;
  eventsTableName: string;
  usersTableName: string;
  userIdGsiName: string;
  ajv: Ajv;
}
