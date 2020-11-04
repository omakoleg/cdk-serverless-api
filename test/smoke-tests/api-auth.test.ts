import { randomString } from "../helpers/utils";
import { apiRead, getBasicAuthHeader } from "./helpers/api";
import { dangerouslyRemoveAuthUser, saveAuthUser } from "./helpers/dynamodb";

jest.setTimeout(5 * 60 * 1000);

describe("Api Endpoint has authentication", () => {
  const accessId = randomString(5);

  afterAll(async () => {
    await dangerouslyRemoveAuthUser(accessId);
  });

  it("Allowed with correct credentials", async () => {
    /**
     * Create test user access
     */
    await saveAuthUser({
      accessId,
      password: accessId,
    });
    const basicAuthHeader = getBasicAuthHeader(accessId, accessId);
    const result = await apiRead("1", basicAuthHeader);
    console.log(result.statusText, result.data);
    expect(result.status).toBe(404); // not 403 or 401
  });

  it("Denied without credentials", async () => {
    const result = await apiRead("2");
    expect(result.status).toBe(401);
  });
  it("Denied with wrong credentials", async () => {
    const result = await apiRead("3", getBasicAuthHeader("user", "not-exist"));
    expect(result.status).toBe(403);
  });
});
