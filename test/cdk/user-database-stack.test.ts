import { expect as expectCDK, haveResourceLike } from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import { UserDatabaseStack } from "../../lib/user-database-stack";

describe("UserDatabaseStack", () => {
  const app = new cdk.App();
  const env = { account: "abc", region: "xxx" };
  const stack = new UserDatabaseStack(app, "Db", {
    env,
  });

  it("has table", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::DynamoDB::Table", {
        KeySchema: [
          {
            AttributeName: "userId",
            KeyType: "HASH",
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: "userId",
            AttributeType: "S",
          },
        ],
        TableName: "users",
      })
    );
  });

  it("correct billing mode", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::DynamoDB::Table", {
        BillingMode: "PAY_PER_REQUEST",
        TableName: "users",
      })
    );
  });
});
