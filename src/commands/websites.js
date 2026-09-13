const websitesService = require('../services/websitesService')
const logger = require('../utils/logger')

const handleWebsites = async (ctx) => {
  const page = parseInt(ctx.callbackQuery.data.split('_').pop() || '1', 10)
  const paginated = websitesService.getPaginated(page, 5)
  const websites = paginated.items

  let msg = '🌐 MY WEBSITES & PROJECTS\n\n'
  if (websites.length === 0) {
    msg += 'No websites added yet.'
  } else {
    websites.forEach(site => {
      msg += `• ${site.name}\n`
      if (site.description) msg += `  ${site.description}\n`
      msg += '\n'
    })
  }
  msg += '\nChoose a website 👇'

  const kb = []
  for (const site of websites) {
    kb.push([{ text: site.name, url: site.url }])
  }
  if (paginated.hasPrev) kb.push([{ text: '⬅️ Previous', callback_data: `websites_page_${page - 1}` }])
  if (paginated.hasNext) kb.push([{ text: 'Next ➡️', callback_data: `websites_page_${page + 1}` }])
  kb.push([{ text: '🏠 Back', callback_data: 'main_menu' }])

  await ctx.editMessageText(msg, { reply_markup: { inline_keyboard: kb } }).catch(() => {})
  logger.info(`User ${ctx.from?.id} viewed websites page ${page}`)
}

module.exports = { handleWebsites }
