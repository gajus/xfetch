// @flow

import retry from 'retry';
import createDebug from './createDebug';
import {
  UnexpectedResponseError
} from './errors';

const debug = createDebug('attemptRequest');

const defaultConfiguration = {
  factor: 2,
  maxTimeout: Infinity,
  minTimeout: 1000,
  randomize: false,
  retries: 5
};

/**
 * A callback that when called initiates a request and returns a promise.
 *
 * @typedef {Function} requestHandler
 * @returns {Promise}
 */

/**
 * A callback that handles HTTP response. It must return true to expected response or false to indicate unsuccessful response.
 *
 * @typedef {Function} validateResponse
 * @param {*} response
 * @returns {boolean}
 */

/**
 * @param {Function} requestHandler
 * @param {validateResponse} validateResponse
 * @param {retryConfiguration} retryConfiguration
 * @returns {Promise<HTTPResponse|HTTPError>}
 */
export default (requestHandler: Function, validateResponse: Function, userRetryConfiguration: RetryConfigurationType = {}): Promise<any> => {
  return new Promise((resolve, reject) => {
    let currentAttempt;

    const retryConfiguration = Object.assign({}, defaultConfiguration, userRetryConfiguration);

    const operation = retry.operation(retryConfiguration);

    currentAttempt = -1;

    operation
      .attempt(async () => {
        ++currentAttempt;

        debug('making %d request attempt (limit: %d)', currentAttempt + 1, retryConfiguration.retries);

        const response = await requestHandler(currentAttempt);

        debug('received response (status code) %d', response.status);

        try {
          const responseIsValid = await validateResponse(response, currentAttempt);

          if (responseIsValid === true) {
            resolve(response);
          } else {
            throw new UnexpectedResponseError(response);
          }
        } catch (error) {
          if (error instanceof UnexpectedResponseError) {
            if (!operation.retry(error)) {
              debug('maximum number of attempts has been exhausted');

              reject(error);

              return;
            }

            debug('response is invalid... going to make another attempt', {
              headers: response.headers,
              status: response.status
            });
          } else {
            reject(error);
          }
        }
      });
  });
};
