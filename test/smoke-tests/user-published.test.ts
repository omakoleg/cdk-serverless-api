import { Event } from "../../src/shared/types/event";
import { randomString } from "../helpers/utils";
import {
  apiRead,
  apiWrite,
  getBasicAuthHeader,
  RequestEvent,
} from "./helpers/api";
import {
  dangerouslyRemoveAuthUser,
  dangerouslyRemoveUser,
  dangerouslyRemoveUserEvents,
  saveAuthUser,
} from "./helpers/dynamodb";
import { repeatCheck } from "./helpers/wait";

jest.setTimeout(5 * 60 * 1000);

const FIXED_TEST_USER_ID = "10";

describe("Full flow", () => {
  const accessId = randomString();
  const password = `p-${accessId}`;

  afterAll(async () => {
    await dangerouslyRemoveAuthUser(accessId);
  });

  it("Works with all events combined into one user", async () => {
    /**
     * Create test user access
     */
    await saveAuthUser({
      accessId,
      password,
    });
    const basicAuthHeader = getBasicAuthHeader(accessId, password);
    /**
     * Clean test data
     */
    await dangerouslyRemoveUserEvents(FIXED_TEST_USER_ID);
    await dangerouslyRemoveUser(FIXED_TEST_USER_ID);
    /**
     * Push API Data for the same user
     */
    const userData: RequestEvent = {
      userId: FIXED_TEST_USER_ID,
      email: "test@test.de",
      name: "Test User",
    };
    const amountData: RequestEvent = {
      userId: FIXED_TEST_USER_ID,
      amount: 500,
    };
    const transactionData1: RequestEvent = {
      userId: FIXED_TEST_USER_ID,
      amount: -100,
    };
    const transactionData2 = {
      userId: FIXED_TEST_USER_ID,
      amount: 10,
    };
    await apiWrite(userData, basicAuthHeader);
    await apiWrite(amountData, basicAuthHeader);
    await apiWrite(transactionData1, basicAuthHeader);
    await apiWrite(transactionData2, basicAuthHeader);
    /**
     * Wait expected user to appear in database
     */
    await repeatCheck(10, 5, async () => {
      const result = await apiRead(FIXED_TEST_USER_ID, basicAuthHeader);
      console.log(result.data);
      return (
        result &&
        result.data &&
        result.data.userId === FIXED_TEST_USER_ID &&
        result.data.balance === 410
      );
    });
  });
});
