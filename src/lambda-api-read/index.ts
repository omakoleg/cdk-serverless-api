import { DynamoDB } from "aws-sdk";
import { handleReadInternal } from "./app";

const docClient = new DynamoDB.DocumentClient({
  region: process.env.AWS_DEFAULT_REGION,
});

export const handleRead = handleReadInternal(
  docClient,
  process.env.USERS_TABLE_NAME!
);
