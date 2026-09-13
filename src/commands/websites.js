const websitesService = require('../services/websitesService')
const { createMainMenu } = require('../keyboards/buttons')
const logger = require('../utils/logger')

const handleWebsites = async (ctx) => {
  const page = parseInt(ctx.callbackQuery.data.split('_').pop() || '1', 10)
  const paginated = websitesService.getPaginated(page, 5)
  const websites = paginated.items

  let msg = '🌐 MY WEBSITES & PROJECTS\n\n'

  if (websites.length === 0) {
    msg += 'No websites added yet.'
  } else {
    websites.forEach((site) => {
      msg += `• ${site.name}\n`
      if (site.description) msg += `  ${site.description}\n`
      msg += `\n`
    })
  }

  msg += `\nChoose a website 👇`

  const kb = { inline_keyboard: [] }
  for (const site of websites) {
    kb.inline_keyboard.push([{ text: site.name, url: site.url }])
  }
  kb.inline_keyboard.push([
    { text: '⬅️ Previous', callback_data: `websites_page_${page - 1}` },
    { text: `Page ${page}/${paginated.totalPages}`, callback_data: 'noop' },
    { text: 'Next ➡️', callback_data: `websites_page_${page + 1}` },
  ])
  kb.inline_keyboard.push([{ text: '🏠 Back', callback_data: 'main_menu' }])

  await ctx.editMessageText(msg, { reply_markup: kb }).catch(() => {})
  logger.info(`User ${ctx.from?.id} viewed websites page ${page}`)
}

module.exports = { handleWebsites }
