import {
  expect as expectCDK,
  haveResourceLike,
  stringLike,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import { ApiStack } from "../../lib/api-stack";
import { AuthDatabaseStack } from "../../lib/auth-database-stack";
import { EventsDatabaseStack } from "../../lib/events-database-stack";
import { UserDatabaseStack } from "../../lib/user-database-stack";

describe("ApiStack", () => {
  const app = new cdk.App();
  const env = { account: "abc", region: "xxx" };

  const { eventsTable } = new EventsDatabaseStack(app, "E", { env });
  const { authTable } = new AuthDatabaseStack(app, "A", {
    env,
  });
  const { usersTable } = new UserDatabaseStack(app, "U", {
    env,
  });
  const stack = new ApiStack(app, "Api", {
    env,
    eventsTable,
    usersTable,
    authTable,
  });

  it("has API", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::ApiGateway::RestApi", {
        Name: "api",
      })
    );
  });

  it("has ReadLambda", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::Lambda::Function", {
        Handler: "index.handleRead",
        Runtime: "nodejs12.x",
        Environment: {
          Variables: {
            USERS_TABLE_NAME: {
              "Fn::ImportValue": stringLike("U:ExportsOutputRefUsersTable*"),
            },
          },
        },
        FunctionName: "read-api",
        TracingConfig: {
          Mode: "Active",
        },
      })
    );
  });

  it("has WriteLambda", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::Lambda::Function", {
        Handler: "index.handleWrite",
        Runtime: "nodejs12.x",
        Environment: {
          Variables: {
            EVENTS_TABLE_NAME: {
              "Fn::ImportValue": stringLike("E:ExportsOutputRefEventsTable*"),
            },
          },
        },
        FunctionName: "write-api",
        TracingConfig: {
          Mode: "Active",
        },
      })
    );
  });

  it("has Auth lambda", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::Lambda::Function", {
        Handler: "index.handleAuth",
        Runtime: "nodejs12.x",
        Environment: {
          Variables: {
            AUTH_TABLE_NAME: {
              "Fn::ImportValue": stringLike("A:ExportsOutputRefAuthTable*"),
            },
          },
        },
        FunctionName: "auth",
        TracingConfig: {
          Mode: "Active",
        },
      })
    );
  });

  it("has write role for events database", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: [
            {
              Action: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
              Effect: "Allow",
              Resource: "*",
            },
            {
              Action: [
                "dynamodb:BatchWriteItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
              ],
              Effect: "Allow",
              Resource: [
                {
                  "Fn::ImportValue": stringLike(
                    "E:ExportsOutputFnGetAttEventsTable*"
                  ),
                },
                {
                  "Fn::Join": [
                    "",
                    [
                      {
                        "Fn::ImportValue": stringLike(
                          "E:ExportsOutputFnGetAttEventsTable*"
                        ),
                      },
                      "/index/*",
                    ],
                  ],
                },
              ],
            },
          ],
          Version: "2012-10-17",
        },
      })
    );
  });

  it("has read role for users database", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: [
            {
              Action: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
              Effect: "Allow",
              Resource: "*",
            },
            {
              Action: [
                "dynamodb:BatchGetItem",
                "dynamodb:GetRecords",
                "dynamodb:GetShardIterator",
                "dynamodb:Query",
                "dynamodb:GetItem",
                "dynamodb:Scan",
              ],
              Effect: "Allow",
              Resource: [
                {
                  "Fn::ImportValue": stringLike(
                    "U:ExportsOutputFnGetAttUsersTable*"
                  ),
                },
                {
                  Ref: "AWS::NoValue",
                },
              ],
            },
          ],
          Version: "2012-10-17",
        },
      })
    );
  });
  it("has real access to Auth table", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: [
            {
              Action: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
              Effect: "Allow",
              Resource: "*",
            },
            {
              Action: [
                "dynamodb:BatchGetItem",
                "dynamodb:GetRecords",
                "dynamodb:GetShardIterator",
                "dynamodb:Query",
                "dynamodb:GetItem",
                "dynamodb:Scan",
              ],
              Effect: "Allow",
              Resource: [
                {
                  "Fn::ImportValue": stringLike(
                    "A:ExportsOutputFnGetAttAuthTable*"
                  ),
                },
                {
                  Ref: "AWS::NoValue",
                },
              ],
            },
          ],
          Version: "2012-10-17",
        },
      })
    );
  });

  it("has authorizer", () => {
    expectCDK(stack).to(
      haveResourceLike("AWS::ApiGateway::Authorizer", {
        Type: "TOKEN",
        IdentitySource: "method.request.header.Authorization",
      })
    );
  });
});
