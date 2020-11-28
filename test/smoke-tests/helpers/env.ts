import { AUTH_TABLE_NAME, EVENTS_TABLE_NAME, USERS_TABLE_NAME, USER_ID_GSI_NAME } from '../../../lib/names';

export const env = {
  apiBaseUrl: 'https://d67ifknoqb.execute-api.eu-west-1.amazonaws.com/prod',
  authUserTableName: AUTH_TABLE_NAME,
  eventsTableName: EVENTS_TABLE_NAME,
  usersTableName: USERS_TABLE_NAME,
  userIdGsiName: USER_ID_GSI_NAME,
  region: 'eu-west-1',
};
