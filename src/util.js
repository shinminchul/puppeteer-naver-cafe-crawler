const log4js = require('log4js');
const { logConfig } = require('../config/config');

exports.makeQuery = (params) => {
  const esc = encodeURIComponent;
  return Object.keys(params)
    .map(k => `${esc(k)}=${esc(params[k])}`)
    .join('&');
};

exports.getLogger = (logger) => {
  log4js.configure(logConfig);
  return log4js.getLogger(logger);
};
