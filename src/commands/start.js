const profileService = require('../services/profileService')
const toolsService = require('../services/toolsService')
const websitesService = require('../services/websitesService')
const adminService = require('../services/adminService')
const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')

const welcomeText = `╭──────────────────────────╮
      👋 Welcome
╰──────────────────────────╯

🚀 Developer Tools & AI Resources

Explore my tools, projects,
websites and AI capabilities.

Choose an option below 👇`

const handleStart = async (ctx) => {
  const stats = adminService.getStats()
  const profile = profileService.get()
  const toolCount = toolsService.getAll().length
  const websiteCount = websitesService.getAll().length

  let msg = welcomeText
  
  if (profile.bio) {
    msg += `\n\n${escapeMarkdown(profile.bio)}`
  }
  
  msg += `\n\n📊 Stats: ${toolCount} tools • ${websiteCount} websites • ${stats.totalUsers} users`
  
  await ctx.reply(msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛠 Tools', callback_data: 'tools_page_1' }, { text: '👤 Profile', callback_data: 'profile_view' }],
        [{ text: '🌐 Websites', callback_data: 'websites_page_1' }, { text: '🔎 Search', callback_data: 'search_prompt' }],
        [{ text: '⚙️ Admin', callback_data: 'admin_menu' }, { text: '📚 Help', callback_data: 'help' }]
      ]
    }
  })
  
  adminService.trackUser(ctx.from?.id)
  logger.info(`User ${ctx.from?.id} started bot`)
}

module.exports = handleStart
