const profileService = require('../services/profileService')
const toolsService = require('../services/toolsService')
const websitesService = require('../services/websitesService')
const adminService = require('../services/adminService')
const { isOwner } = require('../middleware/auth')
const logger = require('../utils/logger')

const handleStart = async (ctx) => {
  const stats = adminService.getStats()
  const profile = profileService.get()
  const toolCount = toolsService.getAll().length
  const websiteCount = websitesService.getAll().length

  let msg = 'Welcome\n\nDeveloper Tools & AI Resources\n\nExplore tools, projects, websites and AI features.\n'
  if (profile.bio) msg += `\n${profile.bio}\n`
  msg += `\nStats: ${toolCount} tools • ${websiteCount} websites • ${stats.totalUsers} users`

  const keyboard = [
    [{ text: 'Tools', callback_data: 'tools_page_1' }, { text: 'Profile', callback_data: 'profile_view' }],
    [{ text: 'Websites', callback_data: 'websites_page_1' }, { text: 'Search', callback_data: 'search_prompt' }],
    [{ text: 'Help', callback_data: 'help' }]
  ]
  if (isOwner(ctx)) {
    keyboard.splice(2, 0, [{ text: 'Admin Control Center', callback_data: 'admin_menu' }])
  }

  const markup = { reply_markup: { inline_keyboard: keyboard } }
  if (ctx.callbackQuery) {
    await ctx.editMessageText(msg, markup).catch(() => ctx.reply(msg, markup))
  } else {
    await ctx.reply(msg, markup)
  }

  adminService.trackUser(ctx.from?.id)
  logger.info(`User ${ctx.from?.id} started bot`)
}

module.exports = handleStart
