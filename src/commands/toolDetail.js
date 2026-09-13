const toolsService = require('../services/toolsService')
const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')

const handleToolDetail = async (ctx) => {
  const toolId = ctx.callbackQuery.data.replace('tool_', '')
  const tool = toolsService.getById(toolId)

  if (!tool) {
    await ctx.reply('❌ Tool not found.')
    return
  }

  let msg = '╭────────────────────╮\n'
  msg += `       ${escapeMarkdown(tool.name)}\n`
  msg += '╰────────────────────╯\n\n'

  if (tool.category) msg += `📌 Category:\n${escapeMarkdown(tool.category)}\n\n`
  if (tool.shortDescription) msg += `📝 Description:\n${escapeMarkdown(tool.shortDescription)}\n\n`
  if (tool.description) msg += `📖 Full Description:\n${escapeMarkdown(tool.description)}\n\n`
  if (tool.usage) msg += `⚡ Usage:\n${escapeMarkdown(tool.usage)}\n\n`
  if (tool.installation) msg += `🔧 Installation:\n${escapeMarkdown(tool.installation)}\n\n`
  if (tool.requirements) msg += `📋 Requirements:\n${escapeMarkdown(tool.requirements)}\n\n`
  if (tool.author) msg += `✍️ Author:\n${escapeMarkdown(tool.author)}\n\n`
  if (tool.version) msg += `🏷 Version:\n${tool.version}\n\n`
  if (tool.tags && tool.tags.length > 0) {
    msg += `🏷 Tags:\n${tool.tags.map(t => `#${t}`).join(' ')}\n\n`
  }

  await ctx.editMessageText(msg.trimEnd(), {
    reply_markup: buildButtons(tool)
  }).catch(() => {})
  
  logger.info(`User ${ctx.from?.id} viewed tool: ${tool.name}`)
}

const buildButtons = (tool) => {
  const kb = []
  if (tool.github) kb.push([{ text: '🌐 GitHub', url: tool.github }])
  if (tool.download) kb.push([{ text: '📥 Download', url: tool.download }])
  if (tool.documentation) kb.push([{ text: '📚 Documentation', url: tool.documentation }])
  if (tool.website) kb.push([{ text: '🔗 Website', url: tool.website }])
  kb.push([{ text: '⬅️ Back', callback_data: `tool_list_${tool.id}` }])
  return { inline_keyboard: kb }
}

module.exports = handleToolDetail
