require('dotenv').config()

function getPublicUrl() {
  const raw = process.env.WEB_APP_URL
    || process.env.RENDER_EXTERNAL_URL
    || (process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : '')
  return String(raw || '').replace(/\/$/, '')
}

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || '',
  OWNER_ID: process.env.OWNER_ID ? parseInt(process.env.OWNER_ID, 10) : null,
  NODE_ENV: process.env.NODE_ENV || 'development',
  WELCOME_ENABLED: process.env.WELCOME_ENABLED === 'false' ? false : true,
  WELCOME_DELETE_AFTER: process.env.WELCOME_DELETE_AFTER ? parseInt(process.env.WELCOME_DELETE_AFTER, 10) : 10,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  AI_PROVIDER: process.env.AI_PROVIDER || 'openai',
  AI_MODEL: process.env.AI_MODEL || 'gpt-4o-mini',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_BASE_URL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  ADMIN_PANEL_SECRET: process.env.ADMIN_PANEL_SECRET || '',
  ADMIN_PORT: process.env.ADMIN_PORT || process.env.PORT || 3001,
  SECRET_KEY: process.env.SECRET_KEY || 'default-secret',
  getPublicUrl,
}
