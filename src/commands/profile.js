const profileService = require('../services/profileService')
const logger = require('../utils/logger')

const handleProfile = async (ctx) => {
  const profile = profileService.get()
  let msg = `${profile.name || 'Developer Profile'}\n\n`
  if (profile.bio) msg += `Bio:\n${profile.bio}\n\n`
  if (profile.description) msg += `About:\n${profile.description}\n\n`
  if (profile.location) msg += `Location:\n${profile.location}\n\n`
  if (profile.email) msg += `Email:\n${profile.email}\n\n`

  const kb = []
  const links = profile.links || {}
  const row = []
  if (links.github) row.push({ text: 'GitHub', url: links.github })
  if (links.website) row.push({ text: 'Website', url: links.website })
  if (row.length) kb.push(row)
  const row2 = []
  if (links.telegram) row2.push({ text: 'Telegram', url: links.telegram })
  if (links.linkedin) row2.push({ text: 'LinkedIn', url: links.linkedin })
  if (row2.length) kb.push(row2)
  kb.push([{ text: 'Home', callback_data: 'main_menu' }])

  const markup = { reply_markup: { inline_keyboard: kb } }
  if (ctx.callbackQuery) {
    await ctx.editMessageText(msg.trimEnd(), markup).catch(() => ctx.reply(msg.trimEnd(), markup))
  } else {
    await ctx.reply(msg.trimEnd(), markup)
  }
  logger.info(`User ${ctx.from?.id} viewed profile`)
}

module.exports = handleProfile
