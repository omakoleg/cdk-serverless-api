import { APIGatewayProxyResult } from "aws-lambda";
import { User } from "./types/user";

export const toResponse = (
  statusCode: 200 | 400 | 404,
  data?: User | string[]
): APIGatewayProxyResult => ({
  statusCode,
  body: JSON.stringify(data || {}),
});
