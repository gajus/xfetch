// @flow

import retry from 'retry';
import Logger from './Logger';
import type {
  IsResponseValidType,
  RequestHandlerType,
  ResponseType,
  RetryConfigurationType
} from './types';
import {
  UnexpectedResponseError
} from './errors';

const log = Logger.child({
  namespace: 'attemptRequest'
});

const defaultConfiguration = {
  factor: 2,
  maxTimeout: Infinity,
  minTimeout: 1000,
  randomize: false,
  retries: 0
};

export default async (
  requestHandler: RequestHandlerType,
  isResponseValid: IsResponseValidType,
  userRetryConfiguration: RetryConfigurationType = {}
): Promise<ResponseType> => {
  const retryConfiguration = {
    ...defaultConfiguration,
    ...userRetryConfiguration
  };

  const operation = retry.operation(retryConfiguration);

  let currentAttempt = -1;

  return new Promise((resolve, reject) => {
    operation.attempt(async () => {
      ++currentAttempt;

      log.debug('making %d request attempt (%d allowed retries)', currentAttempt + 1, retryConfiguration.retries);

      try {
        const response = await requestHandler(currentAttempt);

        log.debug('received response (status code) %d', response.status);

        const responseIsValid = await isResponseValid(response, currentAttempt);

        if (responseIsValid === true) {
          resolve(response);
        } else {
          throw new UnexpectedResponseError(response);
        }
      } catch (error) {
        if (error instanceof UnexpectedResponseError) {
          if (!operation.retry(error)) {
            log.debug('maximum number of attempts has been exhausted');

            reject(error);

            return;
          }

          log.debug('response is invalid... going to make another attempt');
        } else {
          reject(error);
        }
      }
    });
  });
};
