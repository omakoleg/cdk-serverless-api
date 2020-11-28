export function waitSeconds(seconds = 1): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), seconds * 1000);
  });
}

export async function repeatCheck(
  times: number,
  intervalSeconds: number,
  check: () => Promise<boolean>,
  name = 'repeatCheck',
  softExit = false,
): Promise<void> {
  let retries = times;
  let result = false;
  while (retries > 0 && !result) {
    console.log(`[?] check: '${name}', delay seconds: ${intervalSeconds}, times: ${retries}`);
    await waitSeconds(intervalSeconds);
    result = await check();
    retries = retries - 1;
  }
  if (!result && retries === 0) {
    const error = `Run out of '${name}' ${times} retries each ${intervalSeconds} seconds`;
    console.log(error);
    if (!softExit) {
      throw new Error(error);
    }
  }
}
