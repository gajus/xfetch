// @flow

/* eslint-disable no-process-env */

import {
  parse as parseUrl
} from 'url';
import fetch, {
  Headers,
  Request,
  Response
} from 'node-fetch';
import createDebug from 'debug';
import HttpProxyAgent from 'http-proxy-agent';
import HttpsProxyAgent from 'https-proxy-agent';
import attemptRequest from './attemptRequest';
import {
  UnexpectedResponseCodeError,
  UnexpectedResponseError
} from './errors';

const debug = createDebug('xfetch');

const validateResponse = async (response: ResponseType): Promise<boolean> => {
  if (!String(response.status).startsWith('2')) {
    throw new UnexpectedResponseCodeError(response);
  }

  return true;
};

export default async (url: string, userConfiguration: ConfigurationType = {}): Promise<ResponseType> => {
  const configuration = Object.assign({}, userConfiguration);

  if (process.env.HTTP_PROXY) {
    debug('using proxy %s', process.env.HTTP_PROXY);

    if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
      throw new Error('Must configure NODE_TLS_REJECT_UNAUTHORIZED.');
    }

    const AgentConstructor = url.toLowerCase().startsWith('https://') ? HttpsProxyAgent : HttpProxyAgent;

    configuration.agent = new AgentConstructor(process.env.HTTP_PROXY);
  }

  const urlTokens = parseUrl(url);

  if (!urlTokens.hostname) {
    throw new Error('Invalid URL.');
  }

  const host = urlTokens.port === 80 ? urlTokens.host : urlTokens.hostname;

  configuration.headers = configuration.headers || {};

  configuration.headers.host = host;

  const responseHandler = async () => {
    const response = await fetch(url, configuration);

    return {
      headers: response.headers,
      json: response.json.bind(response),
      status: response.status,
      text: response.text.bind(response)
    };
  };

  return attemptRequest(responseHandler, configuration.validateResponse || validateResponse, configuration.retry);
};

export {
  Headers,
  Request,
  Response,
  UnexpectedResponseCodeError,
  UnexpectedResponseError,
  validateResponse
};
