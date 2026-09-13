const toolsService = require('../services/toolsService')
const logger = require('../utils/logger')

const handleToolDetail = async (ctx) => {
  const toolId = String(ctx.callbackQuery?.data || '').replace(/^tool_/, '')
  const tool = toolsService.getById(toolId)

  if (!tool) {
    await ctx.reply('Tool not found.', {
      reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'tools_page_1' }]] }
    })
    return
  }

  let msg = `${tool.name}\n\n`
  if (tool.category) msg += `Category: ${tool.category}\n\n`
  if (tool.shortDescription) msg += `${tool.shortDescription}\n\n`
  if (tool.description) msg += `${tool.description}\n\n`
  if (tool.usage) msg += `Usage:\n${tool.usage}\n\n`
  if (tool.installation) msg += `Installation:\n${tool.installation}\n\n`
  if (tool.author) msg += `Author: ${tool.author}\n`
  if (tool.version) msg += `Version: ${tool.version}\n`

  const kb = []
  if (tool.github) kb.push([{ text: 'GitHub', url: tool.github }])
  if (tool.download) kb.push([{ text: 'Download', url: tool.download }])
  if (tool.documentation) kb.push([{ text: 'Documentation', url: tool.documentation }])
  if (tool.website) kb.push([{ text: 'Website', url: tool.website }])
  kb.push([{ text: 'Back', callback_data: 'tools_page_1' }])

  const markup = { reply_markup: { inline_keyboard: kb } }
  await ctx.editMessageText(msg.trimEnd(), markup).catch(() => ctx.reply(msg.trimEnd(), markup))
  logger.info(`User ${ctx.from?.id} viewed tool: ${tool.name}`)
}

module.exports = handleToolDetail
