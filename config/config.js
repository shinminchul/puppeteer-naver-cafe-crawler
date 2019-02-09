require('dotenv').config();

const config = {
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dbName: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  logConfig: {
    appenders: {
      console: {
        type: 'stdout',
      },
      errorFile: {
        type: 'file',
        filename: 'log/errors.log',
      },
      errors: {
        type: 'logLevelFilter',
        level: 'ERROR',
        appender: 'errorFile',
      },
      database: {
        type: 'file',
        filename: 'log/database.log',
      },
    },
    categories: {
      default: { appenders: ['errors', 'console'], level: 'TRACE' },
      Database: { appenders: ['database', 'console'], level: 'TRACE' },
    },
  },
};

module.exports = config;
