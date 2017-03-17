/* eslint-disable no-unused-vars, no-use-before-define */

import HttpProxyAgent from 'http-proxy-agent';
import HttpsProxyAgent from 'https-proxy-agent';
import {
  CookieJar
} from 'tough-cookie';

type HttpMethodType = string;

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

/**
 * A callback that when called initiates a request.
 */
type RequestHandlerType = (attemptNumber: number) => Promise<ResponseType>;

/**
 * A callback that handles HTTP response. It must return true to expected response or false to indicate unsuccessful response.
 */
type IsResponseValidType = (response: ResponseType) => boolean | Promise<boolean>;

type HeadersConfigurationType = {
  [key: string]: string | number
};

/**
 * A callback used to validate HTTP redirect attempt.
 *
 * Returning false will return the current response.
 * Returning true will follow the redirect.
 * The default behaviour is to follow the redirect.
 */
type HandleRedirectType = (response: ResponseType) => boolean | Promise<boolean>;

type IsResponseRedirectType = (Response: ResponseType) => boolean;

type UserConfigurationType = {
  +body?: string,
  +compress?: boolean,
  +headers?: HeadersConfigurationType,
  +isResponseRedirect?: IsResponseRedirectType,
  +isResponseValid?: IsResponseValidType,
  +jar?: CookieJar,
  +method?: HttpMethodType,
  +retry?: RetryConfigurationType,
  +responseType?: 'full' | 'text'
};

type ConfigurationType = {
  +agent?: HttpProxyAgent | HttpsProxyAgent,
  +body?: string,
  +compress?: boolean,
  +headers: HeadersConfigurationType,
  +isResponseRedirect: IsResponseRedirectType,
  +isResponseValid?: IsResponseValidType,
  +jar?: CookieJar,
  +method?: HttpMethodType,
  +retry?: RetryConfigurationType,
  +responseType: 'full' | 'text'
};

type FetchConfigurationType = {
  +agent?: HttpProxyAgent | HttpsProxyAgent,
  +body?: string,
  +compress?: boolean,
  +headers: HeadersConfigurationType,
  +method: HttpMethodType,
  +redirect: 'manual'
};

type RawHeadersType = {|
  [key: string]: Array<string>
|};

type HeadersType = {|
  +raw: () => RawHeadersType,
  +get: (name: string) => string
|};

type ResponseType = {|
  +headers: HeadersType,
  +json: () => Promise<Object>,
  +status: number,
  +text: () => Promise<string>
|};

type FinalResponseType = ResponseType | string;
