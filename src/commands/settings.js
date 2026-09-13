const settings = require('../config/settings')
const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')

const handleSettings = async (ctx) => {
  let msg = '⚙️ BOT SETTINGS\n\n'
  msg += `Environment: ${settings.NODE_ENV}\n`
  msg += `Welcome: ${settings.WELCOME_ENABLED ? 'Enabled' : 'Disabled'}\n`
  msg += `Delete After: ${settings.WELCOME_DELETE_AFTER}s\n`
  msg += `Log Level: ${settings.LOG_LEVEL}\n`
  msg += `AI Provider: ${settings.AI_PROVIDER}\n`
  msg += `AI Model: ${settings.AI_MODEL}\n`
  msg += `Admin Port: ${settings.ADMIN_PORT}`

  await ctx.reply(msg, {
    reply_markup: { inline_keyboard: [[{ text: '🏠 Back', callback_data: 'admin_menu' }]] }
  })
}

module.exports = handleSettings
