import ExtendableError from 'es6-error';

export class UnexpectedResponseError extends ExtendableError {
  constructor (response) {
    super('Unexpected response.');

    this.response = response;
  }
}

export class UnexpectedResponseCodeError extends UnexpectedResponseError {
  constructor (response) {
    super(response);

    this.message = 'Unespected response code.';
  }
}
