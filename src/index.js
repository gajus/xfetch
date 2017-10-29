// @flow

/* eslint-disable no-process-env */

// eslint-disable-next-line filenames/match-exported
import {
  format as formatUrl,
  parse as parseUrl,
  URLSearchParams
} from 'url';
import {
  promisify
} from 'bluefeather';
import fetch, {
  Headers,
  Request,
  Response
} from 'node-fetch';
import {
  CookieJar
} from 'tough-cookie';
import FormData from 'form-data';
import HttpProxyAgent from 'http-proxy-agent';
import HttpsProxyAgent from 'https-proxy-agent';
import Logger from './Logger';
import type {
  ConfigurationType,
  FetchConfigurationType,
  IsResponseRedirectType,
  IsResponseValidType,
  MakeRequestType,
  ResponseType,
  UserConfigurationType
} from './types';
import attemptRequest from './attemptRequest';
import {
  ResponseTimeoutError,
  UnexpectedResponseCodeError,
  UnexpectedResponseError
} from './errors';

const log = Logger.child({
  namespace: 'client'
});

const isResponseValid: IsResponseValidType = async (response) => {
  if (!String(response.status).startsWith('2') && !String(response.status).startsWith('3')) {
    throw new UnexpectedResponseCodeError(response);
  }

  return true;
};

const isResponseRedirect: IsResponseRedirectType = (response) => {
  return String(response.status).startsWith('3');
};

const handleRedirect = async (response: Response, configuration: ConfigurationType) => {
  const location = response.headers.get('location');

  if (!location) {
    throw new Error('Missing the location header.');
  }

  const originalMethod = configuration.method && configuration.method.toLowerCase();

  const safeMethods = [
    'get',
    'head',
    'options',
    'trace'
  ];

  const nextMethod = safeMethods.includes(originalMethod) ? originalMethod : 'get';

  // eslint-disable-next-line no-use-before-define
  return makeRequest(location, {
    ...configuration,
    method: nextMethod
  });
};

const getHost = (url: string): string => {
  const urlTokens = parseUrl(url);

  if (!urlTokens.hostname) {
    throw new Error('Invalid URL.');
  }

  return urlTokens.port === 80 ? urlTokens.host : urlTokens.hostname;
};

const createConfiguration = async (url: string, userConfiguration: UserConfigurationType): Promise<ConfigurationType> => {
  let cookie;

  if (userConfiguration.jar) {
    const getCookieString = promisify(userConfiguration.jar.getCookieString.bind(userConfiguration.jar));

    cookie = await getCookieString(url);
  }

  let agent;

  if (process.env.HTTP_PROXY) {
    log.debug('using proxy %s', process.env.HTTP_PROXY);

    if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
      throw new Error('Must configure NODE_TLS_REJECT_UNAUTHORIZED.');
    }

    const AgentConstructor = url.toLowerCase().startsWith('https://') ? HttpsProxyAgent : HttpProxyAgent;

    agent = new AgentConstructor(process.env.HTTP_PROXY);
  }

  const host = getHost(url);

  const headers = userConfiguration.headers || {};

  headers.host = host;

  if (cookie) {
    headers.cookie = cookie;
  }

  const responseType = userConfiguration.responseType || 'text';

  const configuration = {
    ...userConfiguration,
    agent,
    headers,
    responseType
  };

  return configuration;
};

const createFetchConfiguration = (configuration: ConfigurationType): FetchConfigurationType => {
  const fetchConfiguration: Object = {
    method: configuration.method || 'get',
    redirect: 'manual',
    timeout: 60 * 60 * 1000
  };

  const fetchConfigurationOptionalProperties = [
    'agent',
    'body',
    'compress',
    'headers',
    'timeout'
  ];

  for (const fetchConfigurationOptionalProperty of fetchConfigurationOptionalProperties) {
    if (configuration[fetchConfigurationOptionalProperty]) {
      fetchConfiguration[fetchConfigurationOptionalProperty] = configuration[fetchConfigurationOptionalProperty];
    }
  }

  return fetchConfiguration;
};

const createUrlWithQuery = (url: string, query: Object) => {
  const urlTokens = parseUrl(url);

  if (urlTokens.query) {
    throw new Error('Cannot append query parameters to URL with existing query parameters.');
  }

  urlTokens.query = query;

  return formatUrl(urlTokens);
};

const makeRequest: MakeRequestType = async (inputUrl, userConfiguration = {}) => {
  log.debug('requesting URL %s', inputUrl);

  const configuration = await createConfiguration(inputUrl, userConfiguration);

  const url = configuration.query ? createUrlWithQuery(inputUrl, configuration.query) : inputUrl;

  const createRequestAttempt = async (): Promise<ResponseType> => {
    const fetchConfiguration = createFetchConfiguration(configuration);

    let response;

    try {
      response = await fetch(url, fetchConfiguration);
    } catch (error) {
      if (typeof error.type === 'string' && error.type === 'request-timeout') {
        throw new ResponseTimeoutError();
      } else {
        throw error;
      }
    }

    if (userConfiguration.jar) {
      const setCookie = promisify(userConfiguration.jar.setCookie.bind(userConfiguration.jar));

      const cookies = response.headers.raw()['set-cookie'];

      if (cookies) {
        for (const cookie of cookies) {
          await setCookie(cookie, url);
        }
      }
    }

    return {
      headers: response.headers,
      json: response.json.bind(response),
      status: response.status,
      text: response.text.bind(response),
      url
    };
  };

  const finalResponse = await attemptRequest(createRequestAttempt, configuration.isResponseValid || isResponseValid, configuration.retry);

  if (isResponseRedirect(finalResponse)) {
    log.debug('response identified as a redirect');

    return handleRedirect(finalResponse, configuration);
  }

  if (configuration.responseType === 'text') {
    return finalResponse.text();
  }

  if (configuration.responseType === 'json') {
    return finalResponse.json();
  }

  return finalResponse;
};

export default makeRequest;

export {
  CookieJar,
  FormData,
  Headers,
  isResponseRedirect,
  isResponseValid,
  Request,
  Response,
  ResponseTimeoutError,
  UnexpectedResponseCodeError,
  UnexpectedResponseError,
  URLSearchParams
};
