import * as cdk from "@aws-cdk/core";
import {
  Table,
  AttributeType,
  BillingMode,
  StreamViewType,
} from "@aws-cdk/aws-dynamodb";
import { RemovalPolicy } from "@aws-cdk/core";
import { EVENTS_TABLE_NAME, USER_ID_GSI_NAME } from "./names";

export class EventsDatabaseStack extends cdk.Stack {
  readonly eventsTable: Table;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.eventsTable = new Table(this, "EventsTable", {
      tableName: EVENTS_TABLE_NAME,
      partitionKey: { name: "eventId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.eventsTable.addGlobalSecondaryIndex({
      indexName: USER_ID_GSI_NAME,
      partitionKey: {
        name: "userId",
        type: AttributeType.STRING,
      },
    });
  }
}
