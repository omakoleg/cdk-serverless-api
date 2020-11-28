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
}

export class LambdaReducerStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: LambdaReducerStackProps
  ) {
    super(scope, id, props);
    const { usersTable, eventsTable } = props;

    const reducerLambda = new NodejsFunction(this, "ReducerLambda", {
      functionName: "reducer",
      entry: join(__dirname, "..", "src", "lambda-reducer", "index.ts"),
      runtime: Runtime.NODEJS_12_X,
      handler: "handleReduce",
      tracing: Tracing.ACTIVE,
      logRetention: RetentionDays.ONE_DAY,
      environment: {
        VERSION: new Date().toISOString(),
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
