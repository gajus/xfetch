// @flow

/* eslint-disable no-process-env */

import fetch, {
  Headers,
  Request,
  Response
} from 'node-fetch';
import createDebug from 'debug';
import HttpsProxyAgent from 'https-proxy-agent';
import attemptRequest from './attemptRequest';
import {
  UnexpectedResponseCodeError,
  UnexpectedResponseError
} from './errors';

const debug = createDebug('xfetch');

const validateResponse = async (response: Object) => {
  if (!String(response.status).startsWith('2')) {
    throw new UnexpectedResponseCodeError(response);
  }

  return true;
};

export default async (url: string, userConfiguration: ConfigurationType = {}) => {
  const configuration = {
    ...userConfiguration
  };

  if (process.env.HTTP_PROXY) {
    debug('using proxy %s', process.env.HTTP_PROXY);

    if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
      throw new Error('Must configure NODE_TLS_REJECT_UNAUTHORIZED.');
    }

    configuration.agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
  }

  return attemptRequest(() => {
    return fetch(url, configuration);
  }, configuration.validateResponse || validateResponse, configuration.retry);
};

export {
  Headers,
  Request,
  Response,
  UnexpectedResponseCodeError,
  UnexpectedResponseError,
  validateResponse
};
