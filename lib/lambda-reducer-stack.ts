import * as cdk from "@aws-cdk/core";
import { Runtime, Tracing, StartingPosition } from "@aws-cdk/aws-lambda";
import { Table } from "@aws-cdk/aws-dynamodb";
import { StackProps } from "@aws-cdk/core";
import { RetentionDays } from "@aws-cdk/aws-logs";
import { join } from "path";
import { DynamoEventSource } from "@aws-cdk/aws-lambda-event-sources";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";

export interface LambdaReducerStackProps extends StackProps {
  eventsTable: Table;
  usersTable: Table;
  userIdGsiName: string;
}

export class LambdaReducerStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: LambdaReducerStackProps
  ) {
    super(scope, id, props);
    const { usersTable, eventsTable, userIdGsiName } = props;

    const reducerLambda = new NodejsFunction(this, "ReducerLambda", {
      functionName: "reducer",
      entry: join(__dirname, "..", "src", "lambda-reducer", "index.ts"),
      runtime: Runtime.NODEJS_12_X,
      handler: "handleReduce",
      tracing: Tracing.ACTIVE,
      logRetention: RetentionDays.ONE_DAY,
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        EVENTS_TABLE_NAME: eventsTable.tableName,
        USER_ID_GSI_NAME: userIdGsiName,
      },
    });
    usersTable.grantWriteData(reducerLambda);
    eventsTable.grantReadData(reducerLambda);
    /** Subscribe to events */
    reducerLambda.addEventSource(
      new DynamoEventSource(eventsTable, {
        startingPosition: StartingPosition.TRIM_HORIZON,
        batchSize: 1,
        retryAttempts: 1,
      })
    );
  }
}
