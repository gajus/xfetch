/* eslint-disable no-unused-vars */

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

type ValidateResponseType = (response: Object) => Promise<boolean>;

type ConfigurationType = {
  +agent?: Object,
  +body?: string | Buffer | Blob | ReadableStream,
  +compress?: boolean,
  +follow?: number,
  +header?: {[key: string]: string | number},
  +method?: string,
  +redirect?: 'follow' | 'manual' | 'error',
  +retry?: RetryConfigurationType,
  +size?: number,
  +timeout?: number,
  +validateResponse?: ValidateResponseType
};
