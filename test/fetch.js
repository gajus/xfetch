import test from 'ava';
import fetch from '../src';

test('throws an error if HTTP_PROXY is configured and NODE_TLS_REJECT_UNAUTHORIZED is not configured', async (t) => {
  await t.throws(() => {
    process.env.HTTP_PROXY = 'http://127.0.0.1:8080';

    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;

    fetch('http://gajus.com/');
  });
});
