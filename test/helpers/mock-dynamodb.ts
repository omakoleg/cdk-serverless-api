import { DynamoDB } from "aws-sdk";

interface Props {
  getOutput?: DynamoDB.DocumentClient.GetItemOutput;
  putOutput?: DynamoDB.DocumentClient.PutItemOutput;
  queryOutput?: DynamoDB.DocumentClient.QueryOutput;
}
export const getMockDynamoDB = ({
  getOutput,
  putOutput,
  queryOutput,
}: Props): {
  docClient: DynamoDB.DocumentClient;
  getParams: DynamoDB.DocumentClient.GetItemInput[];
  putParams: DynamoDB.DocumentClient.PutItemInput[];
  queryParams: DynamoDB.DocumentClient.QueryInput[];
} => {
  const getParams: DynamoDB.DocumentClient.GetItemInput[] = [];
  const putParams: DynamoDB.DocumentClient.PutItemInput[] = [];
  const queryParams: DynamoDB.DocumentClient.QueryInput[] = [];
  return {
    docClient: ({
      get: (params: DynamoDB.DocumentClient.GetItemInput) => {
        getParams.push(params);
        return {
          promise: () => Promise.resolve(getOutput),
        };
      },
      put: (params: DynamoDB.DocumentClient.PutItemInput) => {
        putParams.push(params);
        return {
          promise: () => Promise.resolve(putOutput),
        };
      },
      query: (params: DynamoDB.DocumentClient.QueryInput) => {
        queryParams.push(params);
        return {
          promise: () => Promise.resolve(queryOutput),
        };
      },
    } as unknown) as DynamoDB.DocumentClient,
    getParams,
    putParams,
    queryParams,
  };
};
