// @flow

import test from 'ava';
import attemptRequest from '../src/attemptRequest';

test('requestHandler() callback is called with the number of the attempt (zero-based index)', async (t) => {
  t.plan(4);

  let responseNumber = 0;

  await attemptRequest(async (attemptNumber) => {
    t.true(attemptNumber === responseNumber++);

    return {
      status: 200
    };
  }, (response, attemptNumber) => {
    if (attemptNumber === 3) {
      return true;
    }

    return false;
  }, {
    minTimeout: 0
  });
});

test('attemptRequest validateResponse callback validateResponse() callback is called with the number of the attempt (zero-based index)', async (t) => {
  t.plan(4);

  let responseNumber;

  responseNumber = 0;

  await attemptRequest(() => {
    return responseNumber++;
  }, (response, attemptNumber) => {
    t.true(attemptNumber === response);

    if (response < 3) {
      return false;
    } else {
      return true;
    }
  }, {
    minTimeout: 0
  });
});

test('attemptRequest validateResponse callback is using validateResponse callback to validate the response', async (t) => {
  t.plan(2);

  const response0 = await attemptRequest(() => {
    return {
      foo: 'FOO'
    };
  }, (response) => {
    t.deepEqual(response, {
      foo: 'FOO'
    });

    return true;
  });

  t.deepEqual(response0, {
    foo: 'FOO'
  });
});

test('attemptRequest validateResponse callback retries a request of which response does not validate against validateResponse', async (t) => {
  let firstRequest;

  firstRequest = true;

  const response0 = await attemptRequest(() => {
    if (firstRequest) {
      firstRequest = false;

      return {
        foo: false
      };
    }

    return {
      foo: true
    };
  }, (response) => {
    return response.foo;
  });

  t.deepEqual(response0, {
    foo: true
  });
});
