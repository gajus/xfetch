// @flow

/* eslint-disable no-process-env */

const DEFAULT_REQUEST_TIMEOUT = 60 * 60 * 1000;
const REQUEST_TIMEOUT = process.env.XFETCH_REQUEST_TIMEOUT ? parseInt(process.env.XFETCH_REQUEST_TIMEOUT, 10) : 0;

if (isNaN(REQUEST_TIMEOUT)) {
  throw new TypeError('Unexpected XFETCH_REQUEST_TIMEOUT value.');
}

export {
  DEFAULT_REQUEST_TIMEOUT,
  REQUEST_TIMEOUT
};
