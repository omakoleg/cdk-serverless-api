import { randomString } from '../helpers/utils';
import { apiRead, getBasicAuthHeader } from './helpers/api';
import { dangerouslyRemoveAuthUser, saveAuthUser } from './helpers/dynamodb';

jest.setTimeout(5 * 60 * 1000);

describe('Api Endpoint has authentication', () => {
  const accessId = 'test-user-access';
  const password = `p-${randomString(20)}`;

  afterAll(async () => {
    await dangerouslyRemoveAuthUser(accessId);
  });

  it('Allowed with correct credentials', async () => {
    await saveAuthUser({
      accessId,
      password,
    });
    const basicAuthHeader = getBasicAuthHeader(accessId, password);
    const result = await apiRead('1', basicAuthHeader);
    expect(result.status).toBe(404); // not 403 or 401
  });

  it('Denied without credentials', async () => {
    const result = await apiRead('2');
    expect(result.status).toBe(401);
  });
  it('Denied with wrong credentials', async () => {
    const result = await apiRead('3', getBasicAuthHeader('user', 'not-exist'));
    expect(result.status).toBe(403);
  });
});
