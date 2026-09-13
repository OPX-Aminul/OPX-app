const logger = require('../utils/logger')

const errorHandler = (ctx, next) => {
  return next().catch(async (err) => {
    logger.error(`[ERROR] Handler error:`, err)
    try {
      await ctx.reply('⚠️ Something went wrong. Please try again later.')
    } catch (e) {
      logger.error('[ERROR] Failed to send error message:', e)
    }
  })
}

module.exports = { errorHandler }
