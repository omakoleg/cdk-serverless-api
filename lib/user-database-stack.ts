import * as cdk from "@aws-cdk/core";
import { Table, AttributeType, BillingMode } from "@aws-cdk/aws-dynamodb";
import { RemovalPolicy } from "@aws-cdk/core";
import { USERS_TABLE_NAME } from "./names";

export class UserDatabaseStack extends cdk.Stack {
  readonly usersTable: Table;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.usersTable = new Table(this, "UsersTable", {
      tableName: USERS_TABLE_NAME,
      partitionKey: { name: "userId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
