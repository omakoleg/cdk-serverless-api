import { APIGatewayProxyEvent } from "aws-lambda";
import { handleReadInternal } from "../../src/lambda-api-read/app";
import { User } from "../../src/shared/types/user";
import { getMockDynamoDB } from "../helpers/mock-dynamodb";

describe(".handleReadInternal", () => {
  const user: User = {
    userId: "1",
    name: "Test",
    email: "test@gmail.com",
    balance: 100,
  };

  const eventUserId1 = ({
    queryStringParameters: {
      userId: "1",
    },
  } as unknown) as APIGatewayProxyEvent;

  it("200 Reads User by query ID", async () => {
    const { docClient, getParams } = getMockDynamoDB({
      getOutput: {
        Item: user,
      },
    });

    const result = await handleReadInternal(docClient, "a")(eventUserId1);
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify(user),
    });
    // Verify database layer was accessed correctly
    expect(getParams).toEqual([
      {
        TableName: "a",
        Key: {
          userId: "1",
        },
      },
    ]);
  });

  it("400 Query is missing", async () => {
    const { docClient } = getMockDynamoDB({
      getOutput: {
        Item: user,
      },
    });
    const event = ({} as unknown) as APIGatewayProxyEvent;
    const result = await handleReadInternal(docClient, "a")(event);
    expect(result).toEqual({
      statusCode: 400,
      body: '["Query parameter userId is required"]',
    });
  });

  it("404 User not found", async () => {
    const { docClient } = getMockDynamoDB({
      getOutput: {},
    });
    const result = await handleReadInternal(docClient, "a")(eventUserId1);
    expect(result).toEqual({
      statusCode: 404,
      body: '["User not found"]',
    });
  });
});
