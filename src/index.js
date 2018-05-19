// @flow

// eslint-disable-next-line filenames/match-exported
import {
  parse as parseUrl,
  URLSearchParams
} from 'url';
import got, {
  HTTPError,
  RequestError
} from 'got';
import {
  promisify
} from 'bluefeather';
import {
  CookieJar
} from 'tough-cookie';
import FormData from 'form-data';
import HttpProxyAgent from 'http-proxy-agent';
import HttpsProxyAgent from 'https-proxy-agent';
import getProxy from 'get-url-proxy/cached';
import Logger from './Logger';
import type {
  ConfigurationType,
  CreateRequestType,
  HttpClientConfigurationType,
  IsResponseRedirectType,
  IsResponseValidType,
  ResponseType,
  UserConfigurationType
} from './types';
import attemptRequest from './attemptRequest';
import {
  ResponseTimeoutError,
  UnexpectedResponseCodeError,
  UnexpectedResponseError
} from './errors';
import {
  omit
} from './utilities';
import {
  createHeadersLenient
} from './Headers';
import {
  DEFAULT_REQUEST_TIMEOUT,
  REQUEST_TIMEOUT
} from './config';

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
  let location = response.headers.get('location');

  if (!location) {
    throw new Error('Missing the location header.');
  }

  if (location.startsWith('/')) {
    const urlTokens = parseUrl(response.url);

    location = urlTokens.protocol + '//' + urlTokens.host + location;
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
  return createRequest(location, {
    ...omit(configuration, 'body'),
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

  const proxy = getProxy(url);

  if (proxy) {
    log.debug('using proxy %s', proxy);

    // eslint-disable-next-line no-process-env
    if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
      throw new Error('Must configure NODE_TLS_REJECT_UNAUTHORIZED.');
    }

    const AgentConstructor = url.toLowerCase().startsWith('https://') ? HttpsProxyAgent : HttpProxyAgent;

    agent = new AgentConstructor(proxy);
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

// eslint-disable-next-line complexity
const createHttpClientConfiguration = (configuration: ConfigurationType): HttpClientConfigurationType => {
  const fetchConfiguration: Object = {
    cache: false,
    decompress: true,
    followRedirect: false,
    method: configuration.method ? configuration.method.toUpperCase() : 'GET',
    retries: 0,
    throwHttpErrors: false,
    timeout: configuration.timeout || REQUEST_TIMEOUT || DEFAULT_REQUEST_TIMEOUT
  };

  // @todo Test unexpected options.

  const fetchConfigurationOptionalProperties = [
    'query',
    'agent',
    'body',
    'headers',
    'timeout'
  ];

  for (const fetchConfigurationOptionalProperty of fetchConfigurationOptionalProperties) {
    if (configuration[fetchConfigurationOptionalProperty]) {
      fetchConfiguration[fetchConfigurationOptionalProperty] = configuration[fetchConfigurationOptionalProperty];
    }
  }

  if (fetchConfiguration.body && fetchConfiguration.body instanceof URLSearchParams) {
    fetchConfiguration.body = fetchConfiguration.body.toString();

    // @todo Use Headers.
    // @todo Ensure that content-type is not already set.
    fetchConfiguration.headers = fetchConfiguration.headers || {};
    fetchConfiguration.headers['content-type'] = 'application/x-www-form-urlencoded';
  }

  return fetchConfiguration;
};

const createRequest: CreateRequestType = async (url, userConfiguration = {}) => {
  log.debug('requesting URL %s', url);

  const configuration = await createConfiguration(url, userConfiguration);

  const createRequestAttempt = async (): Promise<ResponseType> => {
    const httpClientConfiguration = createHttpClientConfiguration(configuration);

    let response;

    try {
      response = await got(url, httpClientConfiguration);
    } catch (error) {
      if (error instanceof RequestError && error.code === 'ETIMEDOUT') {
        throw new ResponseTimeoutError();
      }

      if (error instanceof HTTPError) {
        throw error;
      }

      throw error;
    }

    const headers = createHeadersLenient(response.headers);

    if (userConfiguration.jar) {
      const setCookie = promisify(userConfiguration.jar.setCookie.bind(userConfiguration.jar));

      const cookies = headers.raw()['set-cookie'];

      if (cookies) {
        for (const cookie of cookies) {
          await setCookie(cookie, url);
        }
      }
    }

    return {
      headers,
      json: () => {
        return JSON.parse(response.body);
      },
      status: response.statusCode,
      text: () => {
        return response.body;
      },
      url
    };
  };

  const finalResponse = await attemptRequest(createRequestAttempt, configuration.isResponseValid || isResponseValid, configuration.retry);

  const finalIsResponseRedirect = configuration.isResponseRedirect || isResponseRedirect;

  if (finalIsResponseRedirect(finalResponse)) {
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

export default createRequest;

export {
  CookieJar,
  FormData,
  isResponseRedirect,
  isResponseValid,
  ResponseTimeoutError,
  UnexpectedResponseCodeError,
  UnexpectedResponseError,
  URLSearchParams
};
