import { expect as expectCDK, haveResourceLike } from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import { AuthDatabaseStack } from "../../lib/auth-database-stack";

describe("AuthDatabaseStack", () => {
  const app = new cdk.App();
  const env = { account: "abc", region: "xxx" };
  const stack = new AuthDatabaseStack(app, "Db", {
    env,
  });

  it("has table", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::DynamoDB::Table", {
        KeySchema: [
          {
            AttributeName: "accessId",
            KeyType: "HASH",
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: "accessId",
            AttributeType: "S",
          },
        ],
        TableName: "auth-users",
      })
    );
  });

  it("correct billing mode", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::DynamoDB::Table", {
        BillingMode: "PAY_PER_REQUEST",
        TableName: "auth-users",
      })
    );
  });
});
