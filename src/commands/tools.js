const toolsService = require('../services/toolsService')
const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')

const handleToolsList = async (ctx) => {
  const page = parseInt(ctx.callbackQuery.data.split('_').pop() || '1', 10)
  const allTools = toolsService.getAll()
  const paginated = toolsService.getPaginated(page, 5)

  let msg = '🛠 MY TOOLS DIRECTORY\n\n'
  const categories = toolsService.getCategories()

  if (categories.length > 0) {
    msg += `Categories: ${categories.join(', ')}\n\n`
  }
  msg += 'Select a tool below 👇\n\n'

  if (paginated.items.length === 0) {
    msg += 'No tools available yet.'
  } else {
    paginated.items.forEach(t => {
      msg += `• ${t.name} (${t.category})\n`
    })
  }

  await ctx.editMessageText(msg, {
    reply_markup: buildKeyboard(allTools, page)
  }).catch(() => {
    ctx.reply(msg, { reply_markup: buildKeyboard(allTools, page) })
  })
  
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

  if (page > 1) kb.push([{ text: '⬅️ Previous', callback_data: `tools_page_${page - 1}` }])
  if (page < Math.ceil(tools.length / perPage)) kb.push([{ text: 'Next ➡️', callback_data: `tools_page_${page + 1}` }])
  kb.push([{ text: '🏠 Back', callback_data: 'main_menu' }])
  return kb
}

module.exports = { handleToolsList }
