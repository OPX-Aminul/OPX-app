const toolsService = require('../services/toolsService')
const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')

const handleSearchPrompt = async (ctx) => {
  await ctx.reply(
    '🔎 Search Tools\n\nSend me a keyword to search for tools.\n\nExamples: "osint", "security", "web"',
    { reply_markup: { inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'main_menu' }]] } }
  )
  logger.info(`User ${ctx.from?.id} initiated search`)
}

const handleSearch = async (ctx) => {
  const query = ctx.message.text.trim()
  if (!query) {
    await ctx.reply('Please provide a search query.')
    return
  }

  const results = toolsService.search(query)
  if (results.length === 0) {
    await ctx.reply(`No tools found for "${escapeMarkdown(query)}".`)
    return
  }

  let msg = `🔎 Search results for: "${escapeMarkdown(query)}"\n\nFound ${results.length} tool(s):\n\n`
  results.slice(0, 5).forEach((tool, idx) => {
    msg += `${idx + 1}. ${tool.name}\n`
    if (tool.category) msg += `   Category: ${tool.category}\n`
    if (tool.shortDescription) msg += `   ${tool.shortDescription.substring(0, 80)}\n`
    msg += '\n'
  })
  msg += 'Use /<command_name> to view details. More tools via /tools'

  await ctx.reply(msg)
  logger.info(`User ${ctx.from?.id} searched for: ${query}`)
}

module.exports = { handleSearchPrompt, handleSearch }
