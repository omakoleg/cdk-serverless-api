import * as cdk from "@aws-cdk/core";
import { Table, AttributeType, BillingMode } from "@aws-cdk/aws-dynamodb";
import { RemovalPolicy } from "@aws-cdk/core";
import { AUTH_TABLE_NAME } from "./names";

export class AuthDatabaseStack extends cdk.Stack {
  readonly authTable: Table;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.authTable = new Table(this, "AuthTable", {
      tableName: AUTH_TABLE_NAME,
      partitionKey: { name: "accessId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
