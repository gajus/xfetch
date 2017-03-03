/* eslint-disable no-process-env */

import test, {
  afterEach,
  before
} from 'ava';
import nock from 'nock';
import fetch, {
  UnexpectedResponseCodeError
} from '../src';

before(() => {
  nock.disableNetConnect();
});

afterEach(() => {
  delete process.env.HTTP_PROXY;
  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
});

test('throws an error if HTTP_PROXY is configured and NODE_TLS_REJECT_UNAUTHORIZED is not configured', async (t) => {
  process.env.HTTP_PROXY = 'http://127.0.0.1:8080';

  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;

  await t.throws(fetch('http://gajus.com/'));
});

test('throws UnexpectedResponseCode if response code is not 2xx', async (t) => {
  nock('http://gajus.com')
    .get('/')
    .reply(500);

  nock('http://gajus.com')
    .get('/')
    .reply(500);

  const retry = {
    maxTimeout: 0,
    minTimeout: 0,
    retries: 1
  };

  await t.throws(fetch('http://gajus.com/', {retry}), UnexpectedResponseCodeError);
});

test('text() resolves to the response body', async (t) => {
  nock('http://gajus.com')
    .get('/')
    .reply(200, 'Hello, World!');

  const response = await fetch('http://gajus.com/');

  t.true(await response.text() === 'Hello, World!');
});

test('json() resolves to the response body', async (t) => {
  nock('http://gajus.com')
    .get('/')
    .reply(200, '{"foo":"bar"}');

  const response = await fetch('http://gajus.com/');

  const responseBody = await response.json();

  t.deepEqual(responseBody, {
    foo: 'bar'
  });
});

test('headers.raw() resolves response headers', async (t) => {
  nock('http://gajus.com')
    .get('/')
    .reply(200, 'Hello, World!', {
      'x-foo': 'bar'
    });

  const response = await fetch('http://gajus.com/');

  const responseHeaders = response.headers.raw();

  t.deepEqual(responseHeaders, {
    'x-foo': [
      'bar'
    ]
  });
});

test('headers.get() resolves response header', async (t) => {
  nock('http://gajus.com')
    .get('/')
    .reply(200, 'Hello, World!', {
      'x-foo': 'bar'
    });

  const response = await fetch('http://gajus.com/');

  const responseHeaderValue = response.headers.get('x-foo');

  t.true(responseHeaderValue === 'bar');
});
