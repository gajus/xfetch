import fetch from 'node-fetch';
import createDebug from 'debug';
import HttpsProxyAgent from 'https-proxy-agent';

export {
  Headers,
  Request,
  Response
} from 'node-fetch';

const debug = createDebug('xfetch');

export default (url, options = {}) => {
  if (process.env.HTTP_PROXY) {
    debug('using proxy %s', process.env.HTTP_PROXY);

    if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
      throw new Error('Must configure NODE_TLS_REJECT_UNAUTHORIZED.');
    }

    options.agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
  }

  return fetch(url, options);
};
