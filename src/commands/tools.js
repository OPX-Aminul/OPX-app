const toolsService = require('../services/toolsService')
const { createToolsMenu } = require('../keyboards/buttons')
const logger = require('../utils/logger')

const handleToolsList = async (ctx) => {
  const page = parseInt(ctx.callbackQuery.data.split('_').pop() || '1', 10)
  const allTools = toolsService.getAll()
  const paginated = toolsService.getPaginated(page, 5)

  let msg = '🛠 MY TOOLS DIRECTORY\n\n'
  const categories = toolsService.getCategories()

  if (categories.length > 0) {
    msg += 'Select a tool below 👇\n\n'
  }

  if (paginated.items.length === 0) {
    msg += 'No tools available yet.'
  } else {
    paginated.items.forEach((tool) => {
      msg += `• ${tool.name} (${tool.category})\n`
    })
  }

  await ctx.editMessageText(msg || 'Loading...', {
    reply_markup: createToolsMenu(allTools, page),
  }).catch(() => {
    // Ignore edit errors if message not found
  })

  logger.info(`User ${ctx.from?.id} viewed tools page ${page}`)
}

module.exports = { handleToolsList }
