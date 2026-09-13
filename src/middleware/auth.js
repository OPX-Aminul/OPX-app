const settings = require('../config/settings')

const isAdmin = (ctx) => ctx.from?.id === settings.OWNER_ID
const isOwner = (ctx) => ctx.from?.id === settings.OWNER_ID

const ownerOnly = (next) => async (ctx) => {
  if (!settings.OWNER_ID) {
    await ctx.reply('⚠️ Owner not configured.')
    return
  }
  if (!isOwner(ctx)) {
    await ctx.reply('🚫 Unauthorized access.')
    return
  }
  return next(ctx)
}

const adminOrOwner = (next) => async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply('🚫 You do not have permission.')
    return
  }
  return next(ctx)
}

module.exports = { isAdmin, isOwner, ownerOnly, adminOrOwner }
