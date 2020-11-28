import { DynamoDB } from "aws-sdk";
import { AUTH_TABLE_NAME } from "../../lib/names";
import { handleAuthInternal } from "./app";

const docClient = new DynamoDB.DocumentClient({
  region: process.env.AWS_DEFAULT_REGION,
});

export const handleAuth = handleAuthInternal(docClient, AUTH_TABLE_NAME);
