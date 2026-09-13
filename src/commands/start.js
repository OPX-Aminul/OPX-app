const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')
const profileService = require('../services/profileService')
const toolsService = require('../services/toolsService')
const websitesService = require('../services/websitesService')

const welcomeText = `╭──────────────────────────╮
      👋 Welcome
╰──────────────────────────╯

🚀 Developer Tools & Resources

Explore my tools, projects,
websites and developer profile.

Choose an option below 👇`

const handleStart = async (ctx) => {
  const profile = profileService.get()
  let msg = welcomeText

  if (profile.bio) {
    msg += `\n\n${escapeMarkdown(profile.bio)}`
  }

  const toolCount = toolsService.getAll().length
  const websiteCount = websitesService.getAll().length

  msg += `\n\n📊 Stats: ${toolCount} tools • ${websiteCount} websites`

  await ctx.reply(msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🛠 Tools', callback_data: 'tools_page_1' }, { text: '👤 Profile', callback_data: 'profile_view' }],
        [{ text: '🌐 Websites', callback_data: 'websites_page_1' }, { text: '🔎 Search', callback_data: 'search_prompt' }],
        [{ text: '⚙️ Admin', callback_data: 'admin_menu' }, { text: '📚 Help', callback_data: 'help' }],
      ],
    },
  })

  logger.info(`User ${ctx.from?.id} started bot`)
}

module.exports = handleStart
