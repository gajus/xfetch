/* eslint-disable no-process-env */

import test, {
  before,
  beforeEach
} from 'ava';
import nock from 'nock';
import fetch, {
  CookieJar,
  FormData,
  ResponseTimeoutError,
  UnexpectedResponseCodeError,
  URLSearchParams
} from '../src';

before(() => {
  nock.disableNetConnect();
});

beforeEach(() => {
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

  await t.throws(fetch('http://gajus.com/'), UnexpectedResponseCodeError);
});

test(async (t) => {
  nock('http://gajus.com')
    .get('/')
    .delay(2000)
    .reply(200, 'Hello, World!');

  await t.throws(fetch('http://gajus.com/', {
    timeout: 1
  }), ResponseTimeoutError);
});

test('{responseType: text} resolves the response body ', async (t) => {
  nock('http://gajus.com')
    .get('/')
    .reply(200, 'foo');

  const response = await fetch('http://gajus.com/');

  t.true(response === 'foo');
});

test('query parameter appends query to the URL', async (t) => {
  nock('http://gajus.com')
    .get('/')
    .query({
      foo: 'bar'
    })
    .reply(200, 'foo');

  const response = await fetch('http://gajus.com/', {
    query: {
      foo: 'bar'
    }
  });

  t.true(response === 'foo');
});

test('query parameter throws an error when URL already contains query parameters', async (t) => {
  await t.throws(fetch('http://gajus.com/?foo=bar', {
    query: {
      baz: 'qux'
    }
  }));
});

test('{responseType: json} resolves the response body and parses using JSON.parse ', async (t) => {
  nock('http://gajus.com')
    .get('/')
    .reply(200, '"foo"');

  const response = await fetch('http://gajus.com/', {
    responseType: 'json'
  });

  t.true(response === 'foo');
});

test('text() resolves the response body', async (t) => {
  nock('http://gajus.com')
    .get('/')
    .reply(200, 'foo');

  const response = await fetch('http://gajus.com/', {
    responseType: 'full'
  });

  t.true(await response.text() === 'foo');
});

test('json() resolves to the response body', async (t) => {
  nock('http://gajus.com')
    .get('/')
    .reply(200, '{"foo":"bar"}');

  const response = await fetch('http://gajus.com/', {
    responseType: 'full'
  });

  const responseBody = await response.json();

  t.deepEqual(responseBody, {
    foo: 'bar'
  });
});

test('headers.raw() resolves response headers', async (t) => {
  nock('http://gajus.com')
    .get('/')
    .reply(200, 'foo', {
      'x-foo': 'bar'
    });

  const response = await fetch('http://gajus.com/', {
    responseType: 'full'
  });

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
    .reply(200, 'foo', {
      'x-foo': 'bar'
    });

  const response = await fetch('http://gajus.com/', {
    responseType: 'full'
  });

  const responseHeaderValue = response.headers.get('x-foo');

  t.true(responseHeaderValue === 'bar');
});

test('follows 3xx redirects', async (t) => {
  nock('http://gajus.com')
    .get('/')
    .reply(301, undefined, {
      Location: 'http://gajus.com/foo'
    });

  nock('http://gajus.com')
    .get('/foo')
    .reply(200, 'bar');

  const response = await fetch('http://gajus.com/', {
    responseType: 'full'
  });

  t.true(await response.text() === 'bar');
  t.true(response.url === 'http://gajus.com/foo');
});

test('follows 3xx redirects (responseType text)', async (t) => {
  nock('http://gajus.com')
    .get('/')
    .reply(301, undefined, {
      Location: 'http://gajus.com/foo'
    });

  nock('http://gajus.com')
    .get('/foo')
    .reply(200, 'foo');

  const response = await fetch('http://gajus.com/', {
    responseType: 'text'
  });

  t.true(await response === 'foo');
});

test('follows 3xx redirects (responseType JSON)', async (t) => {
  nock('http://gajus.com')
    .get('/')
    .reply(301, undefined, {
      Location: 'http://gajus.com/foo'
    });

  nock('http://gajus.com')
    .get('/foo')
    .reply(200, '"foo"');

  const response = await fetch('http://gajus.com/', {
    responseType: 'json'
  });

  t.true(await response === 'foo');
});

test('follows 3xx redirect preserves the original headers', async (t) => {
  nock('http://gajus.com', {
    reqheaders: {
      'x-foo': 'FOO'
    }
  })
    .get('/')
    .reply(301, '', {
      location: 'http://gajus.com/foo'
    });

  nock('http://gajus.com', {
    reqheaders: {
      'x-foo': 'FOO'
    }
  })
    .get('/foo')
    .reply(200, 'bar');

  const response = await fetch('http://gajus.com/', {
    headers: {
      'x-foo': 'FOO'
    }
  });

  t.true(response === 'bar');
});

test('3xx redirect preserves the original request method if it is safe (GET, HEAD, OPTIONS or TRACE)', async (t) => {
  const safeMethods = [
    'get',
    'head',
    'options'

    // @todo Nock does not implement "trace" method.
    // 'trace'
  ];

  for (const safeMethod of safeMethods) {
    nock('http://gajus.com')[safeMethod]('/')
      .reply(301, 'foo', {
        location: 'http://gajus.com/foo'
      });

    nock('http://gajus.com')[safeMethod]('/foo')
      .reply(200, 'bar');

    const response = await fetch('http://gajus.com/', {
      method: safeMethod
    });

    t.true(response === 'bar');
  }
});

test('3xx redirect changes the request method to GET if the original request method is not safe to repeat (e.g. POST)', async (t) => {
  nock('http://gajus.com')
    .post('/')
    .reply(301, 'foo', {
      location: 'http://gajus.com/foo'
    });

  nock('http://gajus.com')
    .get('/foo')
    .reply(200, 'bar');

  const response = await fetch('http://gajus.com/', {
    method: 'post'
  });

  t.true(response === 'bar');
});

test('3xx redirect changes the request method to GET if the original request method is not safe to repeat (e.g. POST) (with body)', async (t) => {
  nock('http://gajus.com')
    .post('/', 'foo')
    .reply(301, 'foo', {
      location: 'http://gajus.com/foo'
    });

  nock('http://gajus.com')
    .get('/foo')
    .reply(200, 'bar');

  const response = await fetch('http://gajus.com/', {
    body: 'foo',
    method: 'post'
  });

  t.true(response === 'bar');
});

test('redirects persist cookies in a cookie jar', async (t) => {
  const jar = new CookieJar();

  nock('http://gajus.com')
    .get('/')
    .reply(301, 'foo', {
      location: 'http://gajus.com/foo',
      'set-cookie': 'foo=bar'
    });

  nock('http://gajus.com', {
    reqheaders: {
      cookie: 'foo=bar'
    }
  })
    .get('/foo')
    .reply(200, 'bar');

  const response = await fetch('http://gajus.com/', {
    jar
  });

  t.true(response === 'bar');
});

test('FormData', async (t) => {
  const formData = new FormData();

  formData.append('foo', 'bar');

  nock('http://gajus.com')
    .post('/', (body) => {
      return body.replace(/[0-9]+/g, 'X') === '----------------------------X\r\nContent-Disposition: form-data; name="foo"\r\n\r\nbar\r\n----------------------------X--\r\n';
    })
    .reply(200, 'foo');

  const response = await fetch('http://gajus.com/', {
    body: formData,
    method: 'post'
  });

  t.true(response === 'foo');
});

test('URLSearchParams', async (t) => {
  const formData = new URLSearchParams();

  formData.append('foo', 'bar');

  nock('http://gajus.com')
    .post('/', {
      foo: 'bar'
    })
    .reply(200, 'foo');

  const response = await fetch('http://gajus.com/', {
    body: formData,
    method: 'post'
  });

  t.true(response === 'foo');
});
