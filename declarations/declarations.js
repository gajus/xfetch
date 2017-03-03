/* eslint-disable no-unused-vars, no-use-before-define */

type RawHeadersType = {
  [key: string]: string | number
};

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
type ValidateResponseType = (response: ResponseType) => boolean | Promise<boolean>;

type ConfigurationType = {
  +agent?: Object,
  +body?: string | Buffer | Blob | ReadableStream,
  +compress?: boolean,
  +follow?: number,
  +header?: RawHeadersType,
  +method?: string,
  +redirect?: 'follow' | 'manual' | 'error',
  +retry?: RetryConfigurationType,
  +size?: number,
  +timeout?: number,
  +validateResponse?: ValidateResponseType
};

type HeadersType = {|
  +raw: () => Promise<RawHeadersType>,
  +get: (name: string) => Promise<string>
|};

type ResponseType = {|
  +headers: HeadersType,
  +json: () => Promise<Object>,
  +status: number,
  +text: () => Promise<string>
|};
