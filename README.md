# xfetch

[![Travis build status](http://img.shields.io/travis/gajus/xfetch/master.svg?style=flat-square)](https://travis-ci.org/gajus/xfetch)
[![Coveralls](https://img.shields.io/coveralls/gajus/xfetch.svg?style=flat-square)](https://coveralls.io/github/gajus/xfetch)
[![NPM version](http://img.shields.io/npm/v/xfetch.svg?style=flat-square)](https://www.npmjs.org/package/xfetch)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)

A light-weight module that brings `window.fetch` to Node.js ([with `HTTP_PROXY` support](https://github.com/bitinn/node-fetch/issues/195)).

## Usage

Refer to [`node-fetch` documentation](https://github.com/bitinn/node-fetch).

## Behaviour

### HTTP proxy

Configure `HTTP_PROXY` (`http://host:port`) environment variable to proxy the requests.

> Note: You must also configure `NODE_TLS_REJECT_UNAUTHORIZED=0`.
> This is a lazy workaround to enable the proxy to work with TLS.

### Throws error if response code is non-2xx

Throws `UnexpectedResponseCode` error if response code is non-2xx.
