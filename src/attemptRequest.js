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
  retries: 0
};

export default (
  requestHandler: RequestHandlerType,
  validateResponse: ValidateResponseType,
  userRetryConfiguration: RetryConfigurationType = {}
): Promise<ResponseType> => {
  return new Promise((resolve, reject) => {
    let currentAttempt;

    const retryConfiguration = Object.assign({}, defaultConfiguration, userRetryConfiguration);

    const operation = retry.operation(retryConfiguration);

    currentAttempt = -1;

    operation
      .attempt(async () => {
        ++currentAttempt;

        debug('making %d request attempt (%d allowed retries)', currentAttempt + 1, retryConfiguration.retries);

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
