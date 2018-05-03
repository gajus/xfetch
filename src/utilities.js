// @flow

export const omit = <T: Object>(source: T, keyName: string): T => {
  const {
    // eslint-disable-next-line no-unused-vars
    [keyName]: deletedKey,
    ...result
  } = source;

  return result;
};
