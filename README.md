# xfetch

[![Travis build status](http://img.shields.io/travis/gajus/xfetch/master.svg?style=flat-square)](https://travis-ci.org/gajus/xfetch)
[![Coveralls](https://img.shields.io/coveralls/gajus/xfetch.svg?style=flat-square)](https://coveralls.io/github/gajus/xfetch)
[![NPM version](http://img.shields.io/npm/v/xfetch.svg?style=flat-square)](https://www.npmjs.org/package/xfetch)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)

A light-weight module that brings `window.fetch` to Node.js ([with `HTTP_PROXY` support](https://github.com/bitinn/node-fetch/issues/195)).

* [API](#api)
* [Configuration](#configuration)
* [Behaviour](#behaviour)
  * [HTTP proxy](#http-proxy)
  * [Throws an error if response code is non-2xx](#throws-an-error-if-response-code-is-non-2xx)
* [Cookbook](#cookbook)
  * [Retry request](#retry-request)
  * [Validate response](#validate-response)
  * [Make cookies persist between requests](#make-cookies-persist-between-requests)

## API

```js
type HeadersConfigurationType = {
  [key: string]: string | number
};

type RawHeadersType = {|
  [key: string]: Array<string>
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
  +text: () => Promise<string>
|};

/**
 * @property isResponseValid Used to validate response. Refer to [Validate response](#validate-response).
 * @property retry Used to retry requests that produce response that does not pass validation. Refer to [Retry request](#retry-request) and [Validating response](#validating-response).
 * @property jar An instance of `tough-cookie` [`CookieJar`](https://github.com/salesforce/tough-cookie#cookiejar). Used to collect & set cookies.
 */
type UserConfigurationType = {
  +body?: string,
  +compress?: boolean,
  +headers?: HeadersConfigurationType,
  +isResponseRedirect?: IsResponseRedirectType,
  +isResponseValid?: IsResponseValidType,
  +jar?: CookieJar,
  +method?: HttpMethodType,
  +retry?: RetryConfigurationType
};

type fetch = (url: string, configuration?: ConfigurationType) => Promise<ResponseType>;

```

## Behaviour

### HTTP proxy

Uses `HTTP_PROXY` (`http://host:port`) environment variable value to configure HTTP proxy.

> Note: You must also configure `NODE_TLS_REJECT_UNAUTHORIZED=0`.
> This is a lazy workaround to enable the proxy to work with TLS.

### Throws an error if response code is non-2xx or 3xx

Throws `UnexpectedResponseCodeError` error if response code is non-2xx or 3xx.

This behaviour can be overrode using `isResponseValid` configuration.

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

xfetch('http://gajus.com', {
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

xfetch('http://gajus.com', {
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
