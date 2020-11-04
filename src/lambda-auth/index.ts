import { DynamoDB } from "aws-sdk";
import { handleAuthInternal } from "./app";

const docClient = new DynamoDB.DocumentClient({
  region: process.env.AWS_DEFAULT_REGION,
});

export const handleAuth = handleAuthInternal(
  docClient,
  process.env.AUTH_TABLE_NAME!
);
