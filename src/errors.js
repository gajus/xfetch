// @flow

import ExtendableError from 'es6-error';
import type {
  ResponseType
} from './types';

export class UnexpectedResponseError extends ExtendableError {
  response: ResponseType;

  constructor (response: ResponseType) {
    super('Unexpected response.');

    this.response = response;
  }
}

export class UnexpectedResponseCodeError extends UnexpectedResponseError {
  constructor (response: ResponseType) {
    super(response);

    this.message = 'Unexpected response code.';
  }
}

export class ResponseTimeoutError extends ExtendableError {
  constructor () {
    super('Response not received with the configured timeout.');
  }
}
