# xfetch

[![Travis build status](http://img.shields.io/travis/gajus/xfetch/master.svg?style=flat-square)](https://travis-ci.org/gajus/xfetch)
[![Coveralls](https://img.shields.io/coveralls/gajus/xfetch.svg?style=flat-square)](https://coveralls.io/github/gajus/xfetch)
[![NPM version](http://img.shields.io/npm/v/xfetch.svg?style=flat-square)](https://www.npmjs.org/package/xfetch)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)

A light-weight HTTP client for Node.js.

* [API](#api)
* [Configuration](#configuration)
* [Behaviour](#behaviour)
  * [HTTP proxy](#http-proxy)
  * [Throws an error if response code is non-2xx](#throws-an-error-if-response-code-is-non-2xx)
  * [Timeout](#timeout)
* [Cookbook](#cookbook)
  * [Retry request](#retry-request)
  * [Validate response](#validate-response)
  * [Make cookies persist between requests](#make-cookies-persist-between-requests)

## Motivation

It started as a light-wrapper of `node-fetch` due to the lack of [`HTTP_PROXY` support](https://github.com/bitinn/node-fetch/issues/195).

The surface grew to incorporate new requirements. In comparison to the WHATWG [Fetch](https://fetch.spec.whatwg.org/), xfetch API is designed to keep the code minimal by providing short-cuts to common operations.

On top of the `node-fetch`, xfetch implements:

* [HTTP proxy](#http-proxy) support.
* [Response validation](#validate-response).
* [Retry request](#retry-request) strategy.
* [In-built CookieJar](#make-cookies-persist-between-requests).
* Strictly typed API.

## API

```js
type HeadersConfigurationType = {
  [key: string]: string | number
};

type RawHeadersType = {|
  [key: string]: $ReadOnlyArray<string>
|};

type HeadersType = {|
  +raw: () => RawHeadersType,
  +get: (name: string) => string
|};

type IsResponseRedirectType = (Response: ResponseType) => boolean;
type IsResponseValidType = (response: ResponseType) => boolean | Promise<boolean>;

type HttpMethodType = 'get' | 'post' | 'delete' | 'post' | 'trace';

/**
 * @see https://github.com/tim-kos/node-retry#retrytimeoutsoptions
 */
type RetryConfigurationType = {
  factor?: number,
  maxTimeout?: number,
  minTimeout?: number,
  randomize?: boolean,
  retries?: number
};

type ResponseType = {|
  +headers: HeadersType,
  +json: () => Promise<Object>,
  +status: number,
  +text: () => Promise<string>,
  +url: string
|} | string;

/**
 * @property isResponseValid Used to validate response. Refer to [Validate response](#validate-response).
 * @property retry Used to retry requests that produce response that does not pass validation. Refer to [Retry request](#retry-request) and [Validating response](#validating-response).
 * @property jar An instance of `tough-cookie` [`CookieJar`](https://github.com/salesforce/tough-cookie#cookiejar). Used to collect & set cookies.
 * @property timeout Timeout in milliseconds.
 */
type UserConfigurationType = {
  +body?: string | URLSearchParams | FormData,
  +compress?: boolean,
  +headers?: HeadersConfigurationType,
  +isResponseRedirect?: IsResponseRedirectType,
  +isResponseValid?: IsResponseValidType,
  +jar?: CookieJar,
  +method?: HttpMethodType,
  +query?: Object,
  +responseType?: 'full' | 'text' | 'json',
  +retry?: RetryConfigurationType,
  +timeout?: number
};

type fetch = (url: string, configuration?: UserConfigurationType) => Promise<ResponseType>;

```

## Behaviour

### HTTP proxy

Uses `PROTOCOL_PROXY` environment variable value to configure HTTP(S) proxy and supports `NO_PROXY` exclusions.

```
export NO_PROXY=".localdomain,192.168.1."
export HTTP_PROXY="http://host:port"
```

> Note: You must also configure `NODE_TLS_REJECT_UNAUTHORIZED=0`.
> This is a lazy workaround to enable the proxy to work with TLS.

### Throws an error if response code is non-2xx or 3xx

Throws `UnexpectedResponseCodeError` error if response code is non-2xx or 3xx.

This behaviour can be overridden using `isResponseValid` configuration.

### Timeout

`xfetch` defaults to a 60 minutes timeout after which `ResponseTimeoutError` error is thrown.

A timeout error does not trigger the request retry strategy.

```js
import xfetch, {
  ResponseTimeoutError
} from 'xfetch';

try {
  await fetch('http://gajus.com/', {
    timeout: 30 * 1000
  });
} catch (error) {
  if (error instanceof ResponseTimeoutError) {
    // Request has not received a response within 30 seconds.
  }

  throw error;
}

```

## Cookbook

### Retry request

Requests that result in non-2xx response will be retried.

`retry` option is used to configure request retry strategy.

The `retry` configuration shape matches [configuration of the `retry`](https://github.com/tim-kos/node-retry) module.

### Validate response

Define a custom validator function to force use the request retry strategy.

A custom validator is configured using `isResponseValid` configuration, e.g.

```js
import xfetch, {
  UnexpectedResponseError
};

const isResponseValid = async (response) => {
  const body = await response.text();

  if (body.includes('rate error')) {
    throw new UnexpectedResponseError(response);
  }

  return true;
}

await xfetch('http://gajus.com', {
  isResponseValid
});

```

A custom validator must return a boolean flag indicating whether the response is valid. A custom validator can throw an error that extends `UnexpectedResponseError` error.

`xfetch` default validator can be imported and used to extend a custom validator, e.g.

```js
import xfetch, {
  UnexpectedResponseError,
  isResponseValid as defaultIsResponseValid
};

const isResponseValid = async (response) => {
  const responseIsValid = await defaultIsResponseValid(response);

  if (!responseIsValid) {
    return responseIsValid;
  }

  const body = await response.text();

  if (body.includes('rate error')) {
    throw new UnexpectedResponseError(response);
  }

  return true;
}

await xfetch('http://gajus.com', {
  isResponseValid
});

```

## Make cookies persist between requests

`jar` parameter can be passed an instance of `tough-cookie` [`CookieJar`](https://github.com/salesforce/tough-cookie#cookiejar) to collect cookies and use them for the following requests.

```js
import xfetch, {
  CookieJar
};

const jar = new CookieJar();

await xfetch('http://gajus.com/this-url-sets-cookies', {
  jar
});

await xfetch('http://gajus.com/this-url-requires-cookies-to-be-present', {
  jar
});

```

> Note:
>
> `xfetch` exports `CookieJar` class that can be used to construct an instance of `tough-cookie` [`CookieJar`](https://github.com/salesforce/tough-cookie#cookiejar).
