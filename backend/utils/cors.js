/* eslint-disable no-console */
/* eslint-disable consistent-return */
const { allowedUrls } = require('./allowedUrls');

module.exports.cors = (req, res, next) => {
  const requestHeaders = req.headers['access-control-request-headers'];
  const DEFAULT_ALLOWED_METHODS = 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS';
  const { origin } = req.headers;
  const { method } = req;

  if (allowedUrls.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  if (method === 'OPTIONS') {
    res.header('Access-Control-Allow-Headers', requestHeaders);
    res.header('Access-Control-Allow-Methods', DEFAULT_ALLOWED_METHODS);
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.end();
  }

  next();
};
