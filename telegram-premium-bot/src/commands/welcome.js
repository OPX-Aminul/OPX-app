const welcomeService = require('../services/welcomeService')
const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')

const handleRules = async (ctx) => {
  const settings = await import('../database/jsonAdapter.js').then(m => new m.default()).then(db => db.get('settings'))
  const rules = settings?.rules?.content || 'No rules set.'
  
  let msg = '📜 GROUP RULES\n\n'
  msg += escapeMarkdown(rules)
  
  await ctx.reply(msg, {
    reply_markup: { inline_keyboard: [[{ text: '🏠 Home', callback_data: 'main_menu' }]] }
  })
}

const handleWelcomeConfig = async (ctx) => {
  const cfg = welcomeService.get()
  let msg = '👋 WELCOME CONFIGURATION\n\n'
  msg += `Status: ${cfg.welcomeEnabled ? '✅ Enabled' : '❌ Disabled'}\n`
  msg += `Auto-delete: ${cfg.welcomeDeleteAfter} seconds\n\n`
  msg += 'Current message:\n```\n' + escapeMarkdown(cfg.welcomeMessage) + '\n```'

  await ctx.editMessageText(msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✏️ Edit Message', callback_data: 'welcome_edit_msg' }, { text: '✅ Enable/Disable', callback_data: 'welcome_toggle' }],
        [{ text: '⏱️ Set Delete Timer', callback_data: 'welcome_set_timer' }],
        [{ text: '🏠 Back', callback_data: 'admin_menu' }]
      ]
    }
  }).catch(() => {
    ctx.reply(msg, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✏️ Edit Message', callback_data: 'welcome_edit_msg' }, { text: '✅ Enable/Disable', callback_data: 'welcome_toggle' }],
          [{ text: '⏱️ Set Delete Timer', callback_data: 'welcome_set_timer' }],
          [{ text: '🏠 Back', callback_data: 'admin_menu' }]
        ]
      }
    })
  })
  logger.info(`User ${ctx.from?.id} viewed welcome config`)
}

module.exports = { handleRules, handleWelcomeConfig }
