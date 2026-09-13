require('dotenv').config()

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || '',
  OWNER_ID: process.env.OWNER_ID ? parseInt(process.env.OWNER_ID, 10) : null,
  NODE_ENV: process.env.NODE_ENV || 'development',
  WELCOME_ENABLED: process.env.WELCOME_ENABLED === 'false' ? false : true,
  WELCOME_DELETE_AFTER: process.env.WELCOME_DELETE_AFTER ? parseInt(process.env.WELCOME_DELETE_AFTER, 10) : 10,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
}
