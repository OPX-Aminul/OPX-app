const toolsService = require('../services/toolsService')
const websitesService = require('../services/websitesService')
const welcomeService = require('../services/welcomeService')
const adminService = require('../services/adminService')
const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')

const handleAdmin = async (ctx) => {
  const stats = adminService.getStats()
  const toolCount = toolsService.getAll().length
  const websiteCount = websitesService.getAll().length
  const welcomeCfg = welcomeService.get()

  let msg = '╭──────────────────────╮\n'
  msg += '       ⚙️ ADMIN PANEL\n'
  msg += '╰──────────────────────╯\n\n'
  msg += `📊 Statistics:\n`
  msg += `• Tools: ${toolCount}\n`
  msg += `• Websites: ${websiteCount}\n`
  msg += `• Users: ${stats.totalUsers}\n`
  msg += `• Downloads: ${stats.totalDownloads}\n`
  msg += `• Welcome: ${welcomeCfg.welcomeEnabled ? 'Enabled' : 'Disabled'} (${welcomeCfg.welcomeDeleteAfter}s auto-delete)\n\n`
  msg += 'Choose an option below 👇'

  // Build the Mini App URL
  const botUsername = ctx.botInfo?.username || 'opx_team_bot'
  const miniAppUrl = `${process.env.WEB_APP_URL || 'https://your-service.onrender.com'}/admin?init_data=${encodeURIComponent(ctx.web_app_data || '')}`
  
  await ctx.reply(msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🤖 Open Admin Panel (Mini App)', web_app: { url: miniAppUrl } }],
        [{ text: '🛠 Manage Tools', callback_data: 'admin_tools' }, { text: '👤 Edit Profile', callback_data: 'admin_profile' }],
        [{ text: '🌐 Manage Websites', callback_data: 'admin_websites' }, { text: '👋 Welcome Config', callback_data: 'admin_welcome' }],
        [{ text: '📊 Statistics', callback_data: 'admin_stats' }, { text: '⚙️ Settings', callback_data: 'admin_settings' }],
        [{ text: '🏠 Back', callback_data: 'main_menu' }]
      ]
    }
  })
  logger.info(`Owner ${ctx.from?.id} opened admin panel`)
}

module.exports = handleAdmin
