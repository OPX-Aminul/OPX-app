const websitesService = require('../services/websitesService')
const logger = require('../utils/logger')

const handleWebsites = async (ctx) => {
  const raw = ctx.callbackQuery?.data || 'websites_page_1'
  const page = parseInt(String(raw).split('_').pop() || '1', 10) || 1
  const paginated = websitesService.getPaginated(page, 5)
  const websites = paginated.items

  let msg = 'MY WEBSITES & PROJECTS\n\n'
  if (websites.length === 0) {
    msg += 'No websites added yet.'
  } else {
    websites.forEach(site => {
      msg += `• ${site.name}\n`
      if (site.description) msg += `  ${site.description}\n`
      msg += '\n'
    })
  }

  const kb = []
  for (const site of websites) {
    if (site.url) kb.push([{ text: site.name, url: site.url }])
    else kb.push([{ text: site.name, callback_data: 'websites_page_1' }])
  }
  const nav = []
  if (paginated.hasPrev) nav.push({ text: 'Previous', callback_data: `websites_page_${page - 1}` })
  if (paginated.hasNext) nav.push({ text: 'Next', callback_data: `websites_page_${page + 1}` })
  if (nav.length) kb.push(nav)
  kb.push([{ text: 'Home', callback_data: 'main_menu' }])

  const markup = { reply_markup: { inline_keyboard: kb } }
  if (ctx.callbackQuery) {
    await ctx.editMessageText(msg, markup).catch(() => ctx.reply(msg, markup))
  } else {
    await ctx.reply(msg, markup)
  }
  logger.info(`User ${ctx.from?.id} viewed websites page ${page}`)
}

module.exports = { handleWebsites }
