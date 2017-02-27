/* eslint-disable no-process-env */

import fetch, {
  Headers,
  Request,
  Response
} from 'node-fetch';
import createDebug from 'debug';
import HttpsProxyAgent from 'https-proxy-agent';
import {
  UnexpectedResponseCode
} from './errors';

export {
  Headers,
  Request,
  Response,
  UnexpectedResponseCode
};

const debug = createDebug('xfetch');

export default async (url, options = {}) => {
  if (process.env.HTTP_PROXY) {
    debug('using proxy %s', process.env.HTTP_PROXY);

    if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
      throw new Error('Must configure NODE_TLS_REJECT_UNAUTHORIZED.');
    }

    options.agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
  }

  const response = fetch(url, options);

  if (!String(response.status).startsWith(2)) {
    throw new UnexpectedResponseCode(response);
  }

  return response;
};
