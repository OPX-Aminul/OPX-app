const toolsService = require('../services/toolsService')
const websitesService = require('../services/websitesService')
const welcomeService = require('../services/welcomeService')
const adminService = require('../services/adminService')
const settings = require('../config/settings')
const logger = require('../utils/logger')

const getAdminKeyboard = (miniAppUrl) => {
  const rows = []
  if (miniAppUrl) {
    rows.push([{ text: 'Open Admin Control Center', web_app: { url: miniAppUrl } }])
  }
  rows.push(
    [{ text: 'Manage Tools', callback_data: 'admin_tools' }, { text: 'Edit Profile', callback_data: 'admin_profile' }],
    [{ text: 'Manage Websites', callback_data: 'admin_websites' }, { text: 'Welcome Config', callback_data: 'admin_welcome' }],
    [{ text: 'Statistics', callback_data: 'admin_stats' }, { text: 'Settings', callback_data: 'admin_settings' }],
    [{ text: 'AI Providers', callback_data: 'config_ai_providers' }, { text: 'Ads', callback_data: 'admin_ads' }],
    [{ text: 'Smart Dashboard', callback_data: 'smart_dashboard' }],
    [{ text: 'Home', callback_data: 'main_menu' }]
  )
  return { inline_keyboard: rows }
}

const handleAdmin = async (ctx) => {
  const stats = adminService.getStats()
  const toolCount = toolsService.getAll().length
  const websiteCount = websitesService.getAll().length
  const welcomeCfg = welcomeService.get()
  const publicUrl = settings.getPublicUrl() || (process.env.WEB_APP_URL || '').replace(/\/$/, '')

  let msg = 'ADMIN CONTROL CENTER\n\n'
  msg += `Tools: ${toolCount}\n`
  msg += `Websites: ${websiteCount}\n`
  msg += `Users: ${stats.totalUsers}\n`
  msg += `Downloads: ${stats.totalDownloads}\n`
  msg += `Welcome: ${welcomeCfg.welcomeEnabled ? 'Enabled' : 'Disabled'} (${welcomeCfg.welcomeDeleteAfter}s)\n\n`

  if (publicUrl) {
    msg += 'Open the Mini App for the full dashboard, or use the buttons below.'
  } else {
    msg += 'Mini App URL is not configured yet. Use the buttons below, or set WEB_APP_URL / RENDER_EXTERNAL_URL.'
  }

  await ctx.reply(msg, { reply_markup: getAdminKeyboard(publicUrl) })
  logger.info(`Owner ${ctx.from?.id} opened admin panel`)
}

module.exports = handleAdmin
