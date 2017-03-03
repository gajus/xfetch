// @flow

import ExtendableError from 'es6-error';

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

    this.message = 'Unespected response code.';
  }
}
