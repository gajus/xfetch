import test, {
  afterEach
} from 'ava';
import nock from 'nock';
import fetch, {
  UnexpectedResponseCode
} from '../src';

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

  await t.throws(fetch('http://gajus.com'), UnexpectedResponseCode);
});
