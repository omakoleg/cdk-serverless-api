import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { AuthUser } from "../shared/types/auth-user";

/** Load user from database */
const findUser = async (
  docClient: DynamoDB.DocumentClient,
  authTableName: string,
  accessId: string
): Promise<AuthUser | undefined> => {
  const result = await docClient
    .get({
      TableName: authTableName,
      Key: {
        accessId,
      },
    })
    .promise();
  return result.Item as AuthUser;
};

/** Lambda handler */
export const handleAuthInternal = (
  docClient: DynamoDB.DocumentClient,
  authTableName: string
) => async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  const { authorizationToken, methodArn } = event;

  let effect = "Deny";
  let user = "Unknown";
  try {
    const [u, p] = Buffer.from(authorizationToken.split(" ")[1], "base64")
      .toString()
      .split(":");
    user = u;
    const foundUser = await findUser(docClient, authTableName, user);
    if (foundUser && foundUser.password === p) {
      effect = "Allow";
      console.log(`Access allowed: ${user}`);
    }
    console.log("No access:", [u, p], JSON.stringify(foundUser));
  } catch (e) {
    console.log(`Error: ${e}`);
  }
  return {
    principalId: user,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: methodArn,
        },
      ],
    },
  };
};
