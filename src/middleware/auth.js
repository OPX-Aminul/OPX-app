const settings = require('../config/settings')
const logger = require('../utils/logger')

const isAdmin = (ctx) => {
  const userId = ctx.from?.id
  return userId === settings.OWNER_ID
}

const isOwner = (ctx) => {
  const userId = ctx.from?.id
  return userId === settings.OWNER_ID
}

const ownerOnly = (next) => async (ctx) => {
  if (!settings.OWNER_ID) {
    await ctx.reply('⚠️ Owner not configured in environment.')
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
    await ctx.reply('🚫 You do not have permission to use this command.')
    return
  }
  return next(ctx)
}

module.exports = { isAdmin, isOwner, ownerOnly, adminOrOwner }
