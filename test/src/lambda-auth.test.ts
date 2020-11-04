import { getMockDynamoDB } from "../helpers/mock-dynamodb";
import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import { handleAuthInternal } from "../../src/lambda-auth/app";

const expectedPolicy = (
  principalId: string,
  effect: string,
  methodArn: string
) => ({
  principalId,
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
});

describe(".handleAuthInternal", () => {
  it("Error. Header not valid", async () => {
    const { docClient } = getMockDynamoDB({});
    const event = ({
      authorizationToken: "explode",
      methodArn: "b:c",
    } as unknown) as APIGatewayTokenAuthorizerEvent;
    const result = await handleAuthInternal(docClient, "x")(event);
    expect(result).toEqual(expectedPolicy("Unknown", "Deny", "b:c"));
  });

  it("Error. User access not allowed (no user)", async () => {
    const { docClient, getParams } = getMockDynamoDB({
      getOutput: {},
    });
    const event = ({
      authorizationToken: "Basic dGVzdDpleGFtcGxl", // test:example
      methodArn: "b:c:d",
    } as unknown) as APIGatewayTokenAuthorizerEvent;
    const result = await handleAuthInternal(docClient, "B")(event);
    expect(result).toEqual(expectedPolicy("test", "Deny", "b:c:d"));
    expect(getParams).toEqual([
      {
        TableName: "B",
        Key: {
          accessId: "test",
        },
      },
    ]);
  });

  it("Error. User access not allowed (wrong password)", async () => {
    const { docClient, getParams } = getMockDynamoDB({
      getOutput: {
        Item: {
          accessId: "test",
          password: "another",
        },
      },
    });
    const event = ({
      authorizationToken: "Basic dGVzdDpleGFtcGxl", // test:example
      methodArn: "b:c:d",
    } as unknown) as APIGatewayTokenAuthorizerEvent;
    const result = await handleAuthInternal(docClient, "B")(event);
    expect(result).toEqual(expectedPolicy("test", "Deny", "b:c:d"));
    expect(getParams).toEqual([
      {
        TableName: "B",
        Key: {
          accessId: "test",
        },
      },
    ]);
  });

  it("Success", async () => {
    const { docClient } = getMockDynamoDB({
      getOutput: {
        Item: {
          accessId: "test",
          password: "example",
        },
      },
    });
    const event = ({
      authorizationToken: "Basic dGVzdDpleGFtcGxl", // test:example
      methodArn: "b:c:d",
    } as unknown) as APIGatewayTokenAuthorizerEvent;
    const result = await handleAuthInternal(docClient, "B")(event);
    expect(result).toEqual(expectedPolicy("test", "Allow", "b:c:d"));
  });
});
