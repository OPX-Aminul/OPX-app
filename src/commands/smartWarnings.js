const spamDetector = require('../services/smart/spamDetector')
const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')

const handleWarningsList = async (ctx) => {
  const warnings = spamDetector.getActiveWarnings()
  
  let msg = '⚠️ ACTIVE WARNINGS\n\n'
  
  if (warnings.length === 0) {
    msg += 'No active warnings.'
  } else {
    warnings.forEach(w => {
      msg += `• User: ${w.userId}\n`
      msg += `  Reason: ${w.reason}\n`
      msg += `  Previous warnings: ${w.previousWarnings}\n`
      msg += `  Timestamp: ${new Date(w.timestamp).toLocaleString()}\n\n`
    })
  }
  
  msg += 'Use admin actions to manage warnings.'
  
  await ctx.reply(msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🏠 Back', callback_data: 'smart_dashboard' }]
      ]
    }
  })
  
  logger.info(`Owner ${ctx.from?.id} viewed warnings`)
}

const handleWarningAction = async (ctx) => {
  const data = ctx.callbackQuery.data
  const parts = data.split('_')
  const action = parts[1]
  const warningId = parts.slice(2).join('_')
  
  switch (action) {
    case 'dismiss':
      await spamDetector.dismissWarning(warningId, ctx.from?.id)
      await ctx.reply('✅ Warning dismissed.')
      break
    case 'mute':
      await spamDetector.executeAction(warningId, 'mute', ctx.from?.id)
      await ctx.reply('🔇 User muted.')
      break
    case 'ban':
      await spamDetector.executeAction(warningId, 'ban', ctx.from?.id)
      await ctx.reply('🚫 User banned.')
      break
    case 'mark_false_positive':
      await spamDetector.executeAction(warningId, 'false_positive', ctx.from?.id)
      await ctx.reply('⚪ Marked as false positive.')
      break
  }
  
  await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
}

module.exports = { handleWarningsList, handleWarningAction }
