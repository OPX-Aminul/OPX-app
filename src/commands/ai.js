const aiService = require('../services/aiService')
const logger = require('../utils/logger')

const SYSTEM_PROMPT = 'You are a helpful assistant integrated into a Telegram bot. Answer questions concisely and helpfully.'

const handleAI = async (ctx) => {
  const question = ctx.message.text.replace(/^\/ai\s*/, '').trim()
  if (!question) {
    await ctx.reply('Usage: /ai <question>')
    return
  }

  await ctx.reply('🤖 Thinking...', { reply_markup: { remove_keyboard: true } })

  try {
    const response = await aiService.chat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: question }
    ], { maxTokens: 500 })
    await ctx.reply(response.substring(0, 4096))
    logger.info(`User ${ctx.from?.id} asked AI: ${question.substring(0, 50)}`)
  } catch (err) {
    logger.error('AI error:', err)
    await ctx.reply('⚠️ AI service unavailable. Please check configuration.')
  }
}

const handleSummarize = async (ctx) => {
  const text = ctx.message.text.replace(/^\/summarize\s*/, '').trim()
  if (!text) {
    await ctx.reply('Usage: /summarize <text>')
    return
  }

  await ctx.reply('🤖 Summarizing...', { reply_markup: { remove_keyboard: true } })

  try {
    const summary = await aiService.summarize(text)
    await ctx.reply(summary.substring(0, 4096))
  } catch (err) {
    logger.error('AI summarize error:', err)
    await ctx.reply('⚠️ AI service unavailable.')
  }
}

const handleTranslate = async (ctx) => {
  const parts = ctx.message.text.replace(/^\/translate\s*/, '').trim().split(/\s+/)
  const text = parts.slice(0, -1).join(' ')
  const lang = parts[parts.length - 1]

  if (!text || !lang) {
    await ctx.reply('Usage: /translate <text> <language>')
    return
  }

  await ctx.reply('🤖 Translating...', { reply_markup: { remove_keyboard: true } })

  try {
    const translation = await aiService.translate(text, lang)
    await ctx.reply(translation.substring(0, 4096))
  } catch (err) {
    logger.error('AI translate error:', err)
    await ctx.reply('⚠️ AI service unavailable.')
  }
}

module.exports = { handleAI, handleSummarize, handleTranslate }
