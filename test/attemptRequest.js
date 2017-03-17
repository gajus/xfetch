// @flow

import test from 'ava';
import attemptRequest from '../src/attemptRequest';

const createResponse = (status: number = 200): any => {
  return {
    status
  };
};

test('requestHandler() callback is called with the number of the attempt (zero-based index)', async (t) => {
  t.plan(4);

  let responseNumber = 0;

  await attemptRequest(async (attemptNumber) => {
    t.true(attemptNumber === responseNumber++);

    return createResponse();
  }, (response, attemptNumber) => {
    if (attemptNumber === 3) {
      return true;
    }

    return false;
  }, {
    minTimeout: 0,
    retries: 3
  });
});

test('attemptRequest isResponseValid callback isResponseValid() callback is called with the number of the attempt (zero-based index)', async (t) => {
  t.plan(4);

  let responseNumber;

  responseNumber = 0;

  await attemptRequest(() => {
    return createResponse(responseNumber++);
  }, (response, attemptNumber) => {
    t.true(attemptNumber === response.status);

    if (response.status < 3) {
      return false;
    } else {
      return true;
    }
  }, {
    minTimeout: 0,
    retries: 3
  });
});

test('attemptRequest isResponseValid callback is using isResponseValid callback to validate the response', async (t) => {
  t.plan(2);

  const response0 = await attemptRequest(() => {
    return createResponse();
  }, (response) => {
    t.true(response.status === 200);

    return true;
  });

  t.true(response0.status === 200);
});

test('attemptRequest isResponseValid callback retries a request of which response does not validate against isResponseValid', async (t) => {
  let firstRequest;

  firstRequest = true;

  const response0 = await attemptRequest(() => {
    if (firstRequest) {
      firstRequest = false;

      return createResponse(500);
    }

    return createResponse();
  }, (response) => {
    return response.status === 200;
  }, {
    retries: 1
  });

  t.true(response0.status === 200);
});
