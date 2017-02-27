import ExtendableError from 'es6-error';

export class UnexpectedResponseCode extends ExtendableError {
  constructor (response) {
    super('Unexpected response code.');

    this.response = response;
  }
}
