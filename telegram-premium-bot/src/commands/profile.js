const profileService = require('../services/profileService')
const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')

const handleProfile = async (ctx) => {
  const profile = profileService.get()

  let msg = '╭────────────────────╮\n'
  msg += `       ${escapeMarkdown(profile.name || 'Developer Profile')}\n`
  msg += '╰────────────────────╯\n\n'

  if (profile.bio) msg += `📝 Bio:\n${escapeMarkdown(profile.bio)}\n\n`
  if (profile.description) msg += `📖 About:\n${escapeMarkdown(profile.description)}\n\n`
  if (profile.location) msg += `📍 Location:\n${escapeMarkdown(profile.location)}\n\n`
  if (profile.email) msg += `📧 Email:\n${escapeMarkdown(profile.email)}\n\n`

  const links = []
  if (profile.links?.github) links.push('GitHub')
  if (profile.links?.telegram) links.push('Telegram')
  if (profile.links?.website) links.push('Website')
  if (profile.links?.linkedin) links.push('LinkedIn')
  if (profile.links?.twitter) links.push('Twitter')
  
  if (links.length > 0) msg += `Links: ${links.join(' • ')}\n`

  await ctx.editMessageText(msg.trimEnd()).catch(() => ctx.reply(msg.trimEnd()))
  logger.info(`User ${ctx.from?.id} viewed profile`)
}

module.exports = handleProfile
