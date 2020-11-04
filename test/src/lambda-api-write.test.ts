import Ajv from "ajv";
import { getMockDynamoDB } from "../helpers/mock-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";
import { handleWriteInternal } from "../../src/lambda-api-write/app";

const ajv = new Ajv({ allErrors: true });

describe(".handleWriteInternal", () => {
  it("400 Error. No body", async () => {
    const { docClient } = getMockDynamoDB({});
    const event = ({} as unknown) as APIGatewayProxyEvent;
    const result = await handleWriteInternal(docClient, ajv, "x")(event);
    expect(result).toEqual({
      statusCode: 400,
      body: '["Request body is not provided"]',
    });
  });

  it("400 Not Json", async () => {
    const { docClient } = getMockDynamoDB({});
    const event = ({ body: "a" } as unknown) as APIGatewayProxyEvent;
    const result = await handleWriteInternal(docClient, ajv, "x")(event);
    expect(result).toEqual({
      statusCode: 400,
      body: '["SyntaxError: Unexpected token a in JSON at position 0"]',
    });
  });

  it("400 Not Valid Payload", async () => {
    const { docClient } = getMockDynamoDB({});
    const event = ({ body: "{}" } as unknown) as APIGatewayProxyEvent;
    const result = await handleWriteInternal(docClient, ajv, "x")(event);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual([
      " should have required property 'userId'",
      " should have required property 'name'",
      " should have required property 'email'",
      " should have required property 'userId'",
      " should have required property 'amount'",
      " should have required property 'userId'",
      " should have required property 'transaction'",
      " should match some schema in anyOf",
    ]);
  });

  test.each([
    [
      "User",
      {
        name: "bob",
        email: "bob@bob.com",
      },
    ],
    [
      "Balance Update",
      {
        amount: 100,
      },
    ],
    [
      "Transaction",
      {
        transaction: 200,
      },
    ],
  ])("Valid %s is persisted", async (_title, payload) => {
    const { docClient, putParams } = getMockDynamoDB({
      putOutput: {},
    });
    const user = {
      userId: "a",
      ...payload,
    };
    const event = ({
      body: JSON.stringify(user),
    } as unknown) as APIGatewayProxyEvent;
    const result = await handleWriteInternal(
      docClient,
      ajv,
      "A",
      () => "2020-10-20",
      () => "100500"
    )(event);
    expect(result.statusCode).toBe(200);
    expect(putParams).toEqual([
      {
        TableName: "A",
        Item: {
          eventId: "100500",
          createdAt: "2020-10-20",
          userId: "a",
          ...payload,
        },
      },
    ]);
  });

  it("Merged API request is not valid", async () => {
    const { docClient, putParams } = getMockDynamoDB({
      putOutput: {},
    });
    const user = {
      userId: "a",
      name: "bob",
      email: "bob@bob.com",
      amount: 1000, // <- not from here
    };
    const event = ({
      body: JSON.stringify(user),
    } as unknown) as APIGatewayProxyEvent;
    const result = await handleWriteInternal(
      docClient,
      ajv,
      "A",
      () => "2020-10-20",
      () => "100500"
    )(event);
    console.log(result);
    expect(result.statusCode).toBe(400);
    expect(putParams).toEqual([]);

    expect(JSON.parse(result.body)).toContain(
      " should match some schema in anyOf"
    );
  });
});
