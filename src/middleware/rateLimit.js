const rateLimitMap = new Map()
const DEFAULT_LIMIT = 10
const DEFAULT_WINDOW = 60000

const rateLimit = (opts = {}) => {
  const limit = opts.limit || DEFAULT_LIMIT
  const windowMs = opts.window || DEFAULT_WINDOW

  return async (ctx, next) => {
    const key = `${ctx.chat?.id || ctx.from?.id}_${Date.now()}`
    const now = Date.now()
    const record = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs }

    if (now > record.resetAt) {
      record.count = 0
      record.resetAt = now + windowMs
    }
    record.count++
    rateLimitMap.set(key, record)

    if (record.count > limit) {
      await ctx.reply('⏳ Please wait a moment.')
      return
    }
    return next(ctx)
  }
}

module.exports = { rateLimit }
