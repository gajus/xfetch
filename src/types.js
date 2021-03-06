// @flow

/* eslint-disable no-unused-vars, no-use-before-define */

import {
  URLSearchParams
} from 'url';
import HttpProxyAgent from 'http-proxy-agent';
import HttpsProxyAgent from 'https-proxy-agent';
import FormData from 'form-data';
import {
  CookieJar
} from 'tough-cookie';

export type HttpMethodType = string;

/**
 * @see https://github.com/tim-kos/node-retry#retrytimeoutsoptions
 */
export type RetryConfigurationType = {
  factor?: number,
  maxTimeout?: number,
  minTimeout?: number,
  randomize?: boolean,
  retries?: number
};

/**
 * A callback that when called initiates a request.
 */
export type RequestHandlerType = (attemptNumber: number) => Promise<ResponseType>;

/**
 * A callback that handles HTTP response. It must return true to expected response or false to indicate unsuccessful response.
 */
export type IsResponseValidType = (response: ResponseType, currentAttempt: number) => boolean | Promise<boolean>;

export type HeadersConfigurationType = {
  [key: string]: string | number
};

export type IsResponseRedirectType = (Response: ResponseType) => boolean;

export type UserConfigurationType = {
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

export type ConfigurationType = {
  +agent?: HttpProxyAgent | HttpsProxyAgent,
  +body?: string | URLSearchParams | FormData,
  +compress?: boolean,
  +headers: HeadersConfigurationType,
  +isResponseRedirect: IsResponseRedirectType,
  +isResponseValid?: IsResponseValidType,
  +jar?: CookieJar,
  +method?: HttpMethodType,
  +query?: Object,
  +retry?: RetryConfigurationType,
  +responseType: 'full' | 'text' | 'json',
  +timeout: number
};

export type HttpClientConfigurationType = {
  +agent?: HttpProxyAgent | HttpsProxyAgent,
  +body?: string | URLSearchParams | FormData,
  +compress?: boolean,
  +headers: HeadersConfigurationType,
  +method: HttpMethodType,
  +redirect: 'manual'
};

export type RawHeadersType = {|
  [key: string]: $ReadOnlyArray<string>
|};

export type HeadersType = {|
  +raw: () => RawHeadersType,
  +get: (name: string) => string
|};

export type ResponseType = {|
  +headers: HeadersType,
  +json: () => Promise<Object>,
  +status: number,
  +text: () => Promise<string>,
  +url: string
|};

export type CreateRequestType = (inputUrl: string, userConfiguration?: UserConfigurationType) => Promise<*>;
