import { expect as expectCDK, haveResourceLike } from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import { EventsDatabaseStack } from "../../lib/events-database-stack";

describe("EventsDatabaseStack", () => {
  const app = new cdk.App();
  const env = { account: "abc", region: "xxx" };
  const stack = new EventsDatabaseStack(app, "Db", {
    env,
  });

  it("has table", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::DynamoDB::Table", {
        KeySchema: [
          {
            AttributeName: "eventId",
            KeyType: "HASH",
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: "eventId",
            AttributeType: "S",
          },
          {
            AttributeName: "userId",
            AttributeType: "S",
          },
        ],
        TableName: "events",
      })
    );
  });

  it("has stream", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::DynamoDB::Table", {
        StreamSpecification: {
          StreamViewType: "NEW_IMAGE",
        },
        TableName: "events",
      })
    );
  });

  it("has GSI", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::DynamoDB::Table", {
        GlobalSecondaryIndexes: [
          {
            IndexName: "GsiUserId",
            KeySchema: [
              {
                AttributeName: "userId",
                KeyType: "HASH",
              },
            ],
            Projection: {
              ProjectionType: "ALL",
            },
          },
        ],
        TableName: "events",
      })
    );
  });

  it("correct billing mode", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::DynamoDB::Table", {
        BillingMode: "PAY_PER_REQUEST",
        TableName: "events",
      })
    );
  });
});
