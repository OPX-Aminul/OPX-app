const welcomeService = require('../services/welcomeService')
const logger = require('../utils/logger')
const fs = require('fs').promises
const path = require('path')

const SETTINGS_FILE = path.join(__dirname, '../../data/settings.json')

const handleRules = async (ctx) => {
  let rules = 'No rules set yet.'
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf8')
    const settings = JSON.parse(raw)
    rules = settings?.rules?.content || rules
  } catch {}

  await ctx.reply(`GROUP RULES\n\n${rules}`, {
    reply_markup: { inline_keyboard: [[{ text: 'Home', callback_data: 'main_menu' }]] }
  })
}

const handleWelcomeConfig = async (ctx) => {
  const cfg = welcomeService.get()
  let msg = 'WELCOME CONFIGURATION\n\n'
  msg += `Status: ${cfg.welcomeEnabled ? 'Enabled' : 'Disabled'}\n`
  msg += `Auto-delete: ${cfg.welcomeDeleteAfter} seconds\n\n`
  msg += `Current message:\n${cfg.welcomeMessage || '(empty)'}`

  const markup = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Edit Message', callback_data: 'welcome_edit_msg' }, { text: 'Enable/Disable', callback_data: 'welcome_toggle' }],
        [{ text: 'Set Delete Timer', callback_data: 'welcome_set_timer' }],
        [{ text: 'Back', callback_data: 'admin_menu' }]
      ]
    }
  }

  if (ctx.callbackQuery) {
    await ctx.editMessageText(msg, markup).catch(() => ctx.reply(msg, markup))
  } else {
    await ctx.reply(msg, markup)
  }
  logger.info(`User ${ctx.from?.id} viewed welcome config`)
}

module.exports = { handleRules, handleWelcomeConfig }
