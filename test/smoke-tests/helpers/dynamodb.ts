import { DynamoDB } from "aws-sdk";
import { AuthUser } from "../../../src/shared/types/auth-user";
import { env } from "./env";
import { loadEventsByUserId } from "../../../src/lambda-reducer/app";

const docClient = new DynamoDB.DocumentClient({
  region: env.region,
});

console.log("env.region", env.region);

export const saveAuthUser = async (data: AuthUser): Promise<void> => {
  console.log("Adding auth user", JSON.stringify(data));

  await docClient
    .put({
      TableName: env.authUserTableName,
      Item: data,
    })
    .promise();
};

export const dangerouslyRemoveAuthUser = async (
  accessId: string
): Promise<void> => {
  console.log(`dangerouslyRemoveUser: ${accessId}`);
  await docClient
    .delete({
      TableName: env.authUserTableName,
      Key: {
        accessId,
      },
    })
    .promise();
};

export const dangerouslyRemoveUser = async (userId: string): Promise<void> => {
  console.log(`dangerouslyRemoveUser: ${userId}`);
  await docClient
    .delete({
      TableName: env.usersTableName,
      Key: {
        userId,
      },
    })
    .promise();
};

export const dangerouslyRemoveUserEvents = async (
  userId: string
): Promise<void> => {
  console.log(`dangerouslyRemoveUserEvents: ${userId}`);
  const events = await loadEventsByUserId(
    docClient,
    env.eventsTableName,
    env.userIdGsiName,
    userId
  );
  for (const event of events) {
    console.log(`dangerouslyRemoveUserEvents event ${JSON.stringify(event)}`);
    await docClient
      .delete({
        TableName: env.eventsTableName,
        Key: {
          eventId: event.eventId,
        },
      })
      .promise();
  }
};
