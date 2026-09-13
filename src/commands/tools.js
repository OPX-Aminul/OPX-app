const toolsService = require('../services/toolsService')
const logger = require('../utils/logger')

const handleToolsList = async (ctx) => {
  const raw = ctx.callbackQuery?.data || 'tools_page_1'
  const page = parseInt(String(raw).split('_').pop() || '1', 10) || 1
  const allTools = toolsService.getAll()
  const paginated = toolsService.getPaginated(page, 5)

  let msg = 'MY TOOLS DIRECTORY\n\n'
  const categories = toolsService.getCategories()
  if (categories.length > 0) msg += `Categories: ${categories.join(', ')}\n\n`
  msg += `Total: ${allTools.length} tools\n\n`

  if (paginated.items.length === 0) {
    msg += 'No tools available yet.'
  } else {
    paginated.items.forEach(t => {
      msg += `• ${t.name} (${t.category || 'Uncategorized'})\n`
    })
  }

  const markup = { reply_markup: { inline_keyboard: buildKeyboard(allTools, page) } }
  if (ctx.callbackQuery) {
    await ctx.editMessageText(msg, markup).catch(() => ctx.reply(msg, markup))
  } else {
    await ctx.reply(msg, markup)
  }
  logger.info(`User ${ctx.from?.id} viewed tools page ${page}`)
}

const buildKeyboard = (tools, page) => {
  const kb = []
  const perPage = 5
  const start = (page - 1) * perPage
  const pageTools = tools.slice(start, start + perPage)
  for (const tool of pageTools) {
    kb.push([{ text: tool.name, callback_data: `tool_${tool.id}` }])
  }
  const nav = []
  if (page > 1) nav.push({ text: 'Previous', callback_data: `tools_page_${page - 1}` })
  if (page < Math.ceil(tools.length / perPage)) nav.push({ text: 'Next', callback_data: `tools_page_${page + 1}` })
  if (nav.length) kb.push(nav)
  kb.push([{ text: 'Home', callback_data: 'main_menu' }])
  return kb
}

module.exports = { handleToolsList }
