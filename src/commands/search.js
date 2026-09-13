const toolsService = require('../services/toolsService')
const logger = require('../utils/logger')

const pendingSearch = new Set()

const handleSearchPrompt = async (ctx) => {
  if (ctx.from?.id) pendingSearch.add(ctx.from.id)
  await ctx.reply('Search Tools\n\nSend a keyword, for example: osint, security, web', {
    reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'main_menu' }]] }
  })
  logger.info(`User ${ctx.from?.id} initiated search`)
}

const handleSearch = async (ctx) => {
  let query = (ctx.message?.text || '').trim()
  if (query.startsWith('/search')) query = query.replace(/^\/search(@\w+)?\s*/i, '').trim()
  if (!query) {
    await handleSearchPrompt(ctx)
    return
  }

  if (ctx.from?.id) pendingSearch.delete(ctx.from.id)
  const results = toolsService.search(query)
  if (results.length === 0) {
    await ctx.reply(`No tools found for "${query}".`, {
      reply_markup: { inline_keyboard: [[{ text: 'Home', callback_data: 'main_menu' }]] }
    })
    return
  }

  let msg = `Search results for "${query}"\n\nFound ${results.length} tool(s):\n\n`
  results.slice(0, 8).forEach((tool, idx) => {
    msg += `${idx + 1}. ${tool.name}\n`
    if (tool.category) msg += `   ${tool.category}\n`
    if (tool.shortDescription) msg += `   ${tool.shortDescription.substring(0, 80)}\n`
    msg += '\n'
  })

  const kb = results.slice(0, 8).map(t => [{ text: t.name, callback_data: `tool_${t.id}` }])
  kb.push([{ text: 'Home', callback_data: 'main_menu' }])
  await ctx.reply(msg, { reply_markup: { inline_keyboard: kb } })
  logger.info(`User ${ctx.from?.id} searched for: ${query}`)
}

module.exports = { handleSearchPrompt, handleSearch, pendingSearch }
