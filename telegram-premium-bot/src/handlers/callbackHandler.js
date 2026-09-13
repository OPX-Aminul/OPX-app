const { handleToolsList } = require('../commands/tools')
const { handleToolDetail } = require('../commands/toolDetail')
const { handleProfile } = require('../commands/profile')
const { handleWebsites } = require('../commands/websites')
const { handleSearchPrompt } = require('../commands/search')
const { handleAdmin } = require('../commands/admin')
const { handleHelp } = require('../commands/help')
const { handleSettings } = require('../commands/settings')
const { handleStats } = require('../commands/stats')
const { handleWelcomeConfig } = require('../commands/welcome')
const { handleAdminTools, handleAddToolName, handleAddToolCommand, handleAddToolCategory, handleAddToolDescription, handleAddToolGitHub, handleAddToolDownload, addFlow } = require('../commands/adminTools')
const { isAdmin, isOwner } = require('../middleware/auth')
const logger = require('../utils/logger')

module.exports = (bot) => {
  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data
    logger.info(`Callback: ${data} from user ${ctx.from?.id}`)

    switch (data) {
      case 'main_menu':
        await ctx.answerCbQuery()
        // Trigger start command
        await require('../commands/start')(ctx)
        break
      case 'tools_page_1':
      case 'tools_page_2':
      case 'tools_page_3':
      case 'tools_page_4':
      case 'tools_page_5':
        await ctx.answerCbQuery()
        await handleToolsList(ctx)
        break
      case 'websites_page_1':
      case 'websites_page_2':
        await ctx.answerCbQuery()
        await handleWebsites(ctx)
        break
      default:
        if (data.startsWith('tool_')) {
          await ctx.answerCbQuery()
          await handleToolDetail(ctx)
        } else if (data === 'profile_view') {
          await ctx.answerCbQuery()
          await handleProfile(ctx)
        } else if (data === 'search_prompt') {
          await ctx.answerCbQuery()
          await handleSearchPrompt(ctx)
        } else if (data === 'help') {
          await ctx.answerCbQuery()
          await handleHelp(ctx)
        } else if (data === 'admin_menu') {
          await ctx.answerCbQuery()
          if (!isAdmin(ctx)) {
            await ctx.reply('🚫 Unauthorized.')
            return
          }
          await handleAdmin(ctx)
        } else if (data === 'admin_settings') {
          await ctx.answerCbQuery()
          if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
          await handleSettings(ctx)
        } else if (data === 'admin_stats') {
          await ctx.answerCbQuery()
          if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
          await handleStats(ctx)
        } else if (data === 'admin_welcome') {
          await ctx.answerCbQuery()
          if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
          await handleWelcomeConfig(ctx)
        } else if (data === 'admin_tools') {
          await ctx.answerCbQuery()
          if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
          await handleAdminTools(ctx)
        } else if (data === 'admin_add_tool') {
          await ctx.answerCbQuery()
          if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
          await handleAddToolPrompt(ctx)
        }
        break
    }
  })
}
