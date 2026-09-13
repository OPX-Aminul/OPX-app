const adminService = require('../services/adminService')
const toolsService = require('../services/toolsService')
const websitesService = require('../services/websitesService')
const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')

const handleStats = async (ctx) => {
  const stats = adminService.getStats()
  const tools = toolsService.getAll()
  const websites = websitesService.getAll()

  let msg = '📊 STATISTICS\n\n'
  msg += `👥 Total Users: ${stats.totalUsers}\n`
  msg += `🛠 Total Tools: ${tools.length}\n`
  msg += `🌐 Total Websites: ${websites.length}\n`
  msg += `📥 Total Downloads: ${stats.totalDownloads}\n\n`
  
  if (stats.commandUsage && Object.keys(stats.commandUsage).length > 0) {
    msg += '📈 Command Usage:\n'
    Object.entries(stats.commandUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([cmd, count]) => { msg += `  /${cmd}: ${count}\n` })
  }

  await ctx.reply(msg, {
    reply_markup: { inline_keyboard: [[{ text: '🏠 Back', callback_data: 'admin_menu' }]] }
  })
}

module.exports = handleStats
