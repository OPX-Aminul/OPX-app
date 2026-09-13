const { handleSearch } = require('../commands/search')
const { handleAI, handleSummarize, handleTranslate } = require('../commands/ai')
const { handleAddToolName, handleAddToolCommand, handleAddToolCategory, handleAddToolDescription, handleAddToolGitHub, handleAddToolDownload, addFlow } = require('../commands/adminTools')
const { isAdmin, isOwner } = require('../middleware/auth')
const logger = require('../utils/logger')

module.exports = (bot) => {
  bot.on('message', async (ctx) => {
    const text = ctx.message.text
    const userId = ctx.from?.id
    logger.info(`Message from ${userId}: ${text}`)

    if (text.startsWith('/search')) {
      await handleSearch(ctx)
      return
    }

    if (text.startsWith('/ai')) {
      await handleAI(ctx)
      return
    }

    if (text.startsWith('/summarize')) {
      await handleSummarize(ctx)
      return
    }

    if (text.startsWith('/translate')) {
      await handleTranslate(ctx)
      return
    }

    // Handle admin tool addition flow
    const userFlow = addFlow[userId]
    if (userFlow && isOwner(ctx)) {
      switch (userFlow.step) {
        case 'name': await handleAddToolName(ctx); break
        case 'command': await handleAddToolCommand(ctx); break
        case 'category': await handleAddToolCategory(ctx); break
        case 'description': await handleAddToolDescription(ctx); break
        case 'github': await handleAddToolGitHub(ctx); break
        case 'download': await handleAddToolDownload(ctx); break
      }
      return
    }
  })
}
