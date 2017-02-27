# xfetch

[![Travis build status](http://img.shields.io/travis/gajus/xfetch/master.svg?style=flat-square)](https://travis-ci.org/gajus/xfetch)
[![Coveralls](https://img.shields.io/coveralls/gajus/xfetch.svg?style=flat-square)](https://coveralls.io/github/gajus/xfetch)
[![NPM version](http://img.shields.io/npm/v/xfetch.svg?style=flat-square)](https://www.npmjs.org/package/xfetch)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)

A light-weight module that brings `window.fetch` to Node.js ([with `HTTP_PROXY` support](https://github.com/bitinn/node-fetch/issues/195)).

## API

```js
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

type ValidateResponseType = (response: Object) => Promise<boolean>;

type ConfigurationType = {
  +agent?: Object,
  +body?: string | Buffer | Blob | ReadableStream,
  +compress?: boolean,
  +follow?: number,
  +header?: {[key: string]: string | number},
  +method?: string,
  +redirect?: 'follow' | 'manual' | 'error',
  +retry?: RetryConfigurationType,
  +size?: number,
  +timeout?: number,
  +validateResponse?: ValidateResponseType
};

type fetch = (url: string, configuration?: ConfigurationType) => Promise<Object>;

```

## Configuration

|Name|Value|
|---|---|
|`retry`|Used to retry requests that produce response that does not pass validation. Refer to [Retry request](#retry-request) and [Validating response](#validating-response).|
|`validateResponse`|Used to validate response. Refer to [Validating response](#validating-response).|

For other configuration properties, refer to [`node-fetch` documentation](https://github.com/bitinn/node-fetch).

## Behaviour

### HTTP proxy

Uses `HTTP_PROXY` (`http://host:port`) environment variable value to configure HTTP proxy.

> Note: You must also configure `NODE_TLS_REJECT_UNAUTHORIZED=0`.
> This is a lazy workaround to enable the proxy to work with TLS.

### Throws an error if response code is non-2xx

Throws `UnexpectedResponseCodeError` error if response code is non-2xx.

This behaviour can be overrode using `validateResponse` configuration.

### Retry request

Requests that result in non-2xx response will be retried.

`retry` option is used to configure request retry strategy.

The `retry` configuration shape matches [configuration of the `retry`](https://github.com/tim-kos/node-retry) module.

### Validating response

Define a custom validator function to force use the request retry strategy.

A custom validator is configured using `validateResponse` configuration, e.g.

```js
import xfetch, {
  UnexpectedResponseError
};

const validateResponse = async (response) => {
  const body = await response.text();

  if (body.includes('rate error')) {
    throw new UnexpectedResponseError(response);
  }

  return true;
}

xfetch('http://gajus.com', {validateResponse});

```

A custom validator must return a boolean flag indicating whether the response is valid. A custom validator can throw an error that extends `UnexpectedResponseError` error.

`xfetch` default validator can be imported and used to extend a custom validator, e.g.

```js
import xfetch, {
  UnexpectedResponseError,
  validateResponse as defaultValidateResponse
};

const validateResponse = async (response) => {
  const responseIsValid = await defaultValidateResponse(response);

  if (!responseIsValid) {
    return responseIsValid;
  }

  const body = await response.text();

  if (body.includes('rate error')) {
    throw new UnexpectedResponseError(response);
  }

  return true;
}

xfetch('http://gajus.com', {validateResponse});

```
