const { Telegraf } = require('telegraf')
const express = require('express')
const path = require('path')
require('dotenv').config()

const settings = require('./config/settings')
const logger = require('./utils/logger')
const toolsService = require('./services/toolsService')
const profileService = require('./services/profileService')
const websitesService = require('./services/websitesService')
const welcomeService = require('./services/welcomeService')
const adminService = require('./services/adminService')
const aiService = require('./services/aiService')
const adsService = require('./services/adsService')
const downloadsService = require('./services/downloadsService')
const channelsService = require('./services/channelsService')
const moderationService = require('./services/moderationService')
const configService = require('./services/config/configService')
const smartOrchestrator = require('./services/smart/aiOrchestrator')
const incidentManager = require('./services/smart/incidentManager')
const spamDetector = require('./services/smart/spamDetector')
const knowledgeBase = require('./services/smart/knowledgeBase')
const githubService = require('./services/smart/githubService')
const toolMatcher = require('./services/smart/toolMatcher')
const { errorHandler } = require('./middleware/errorHandler')
const { ownerOnly, isAdmin, isOwner } = require('./middleware/auth')
const { escapeMarkdown } = require('./utils/helpers')

// Import API routes
const apiRouter = require('./api')
const handleStart = require('./commands/start')
const handleHelp = require('./commands/help')
const { handleToolsList } = require('./commands/tools')
const handleToolDetail = require('./commands/toolDetail')
const handleProfile = require('./commands/profile')
const { handleWebsites } = require('./commands/websites')
const { handleSearchPrompt, handleSearch } = require('./commands/search')
const handleAdmin = require('./commands/admin')
const { handleRules, handleWelcomeConfig } = require('./commands/welcome')
const handleSettings = require('./commands/settings')
const handleStats = require('./commands/stats')
const { handleAdminTools, addFlow, handleAddToolPrompt, handleAddToolName, handleAddToolCommand, handleAddToolCategory, handleAddToolDescription, handleAddToolGitHub, handleAddToolDownload } = require('./commands/adminTools')
const { handleAdminAds, adFlow: adFlow } = require('./commands/adminAds')
const { handleAI, handleSummarize, handleTranslate } = require('./commands/ai')
const { handleSmartDashboard } = require('./commands/smartDashboard')
const { handleWarningsList } = require('./commands/smartWarnings')
const { handleKnowledgeBase, handleAddSolutionPrompt, handleAddSolutionQuestion, handleAddSolutionAnswer, kbFlow } = require('./commands/smartKnowledge')
const { 
  handleAdminConfig, 
  handleAIProvidersList, 
  handleAddProviderPrompt, 
  handleAddProviderName, 
  handleAddProviderUrl, 
  handleAddProviderKey,
  handleTestProvider,
  handleRefreshModels,
  configFlow 
} = require('./commands/adminConfig')

// Initialize bot
const bot = new Telegraf(settings.BOT_TOKEN)

bot.use(errorHandler)

// Commands
bot.command('start', handleStart)
bot.command('help', handleHelp)
bot.command('profile', handleProfile)
bot.command('about', handleProfile)
bot.command('tools', async (ctx) => {
  const tools = toolsService.getAll()
  const categories = toolsService.getCategories()
  let msg = '🛠 MY TOOLS DIRECTORY\n\n'
  if (categories.length > 0) msg += `Categories: ${categories.join(', ')}\n\n`
  msg += `Total: ${tools.length} tools\n\nSelect from menu below`
  await ctx.reply(msg, {
    reply_markup: {
      inline_keyboard: [
        ...tools.slice(0, 10).map(t => [{ text: t.name, callback_data: `tool_${t.id}` }]),
        [{ text: '⬅️ Previous', callback_data: 'tools_page_1' }, { text: 'Next ➡️', callback_data: 'tools_page_2' }],
        [{ text: '🏠 Home', callback_data: 'main_menu' }]
      ]
    }
  })
})
bot.command('websites', async (ctx) => {
  const websites = websitesService.getAll()
  let msg = '🌐 MY WEBSITES & PROJECTS\n\n'
  if (websites.length === 0) msg += 'No websites added yet.'
  else websites.forEach(w => msg += `• ${w.name} - ${w.url}\n`)
  await ctx.reply(msg, { reply_markup: { inline_keyboard: [[{ text: '🏠 Home', callback_data: 'main_menu' }]] } })
})
bot.command('rules', async (ctx) => {
  try {
    const db = new (require('./database/jsonAdapter'))()
    await db.load()
    const settings = await db.get('settings')
    const rules = settings?.rules?.content || 'No rules set.'
    await ctx.reply(`📜 GROUP RULES\n\n${rules}`, { reply_markup: { inline_keyboard: [[{ text: '🏠 Home', callback_data: 'main_menu' }]] } })
  } catch (err) {
    await ctx.reply('📜 GROUP RULES\n\nNo rules set yet.')
  }
})
bot.command('admin', ownerOnly(handleAdmin))
bot.command('addtool', ownerOnly(handleAddToolPrompt))
bot.command('listtools', ownerOnly(handleAdminTools))
bot.command('search', handleSearch)
bot.command('ai', handleAI)
bot.command('summarize', handleSummarize)
bot.command('translate', handleTranslate)
bot.command('settings', ownerOnly(handleSettings))
bot.command('stats', ownerOnly(handleStats))
bot.command('smart', ownerOnly(handleSmartDashboard))
bot.command('warnings', ownerOnly(handleWarningsList))
bot.command('knowledge', ownerOnly(handleKnowledgeBase))
bot.command('config', ownerOnly(handleAdminConfig))

// Group AI middleware
bot.on('message', async (ctx) => {
  // Skip if it's a command
  if (ctx.message.text?.startsWith('/')) return
  
  const userId = ctx.from?.id
  const groupId = ctx.chat?.id
  const message = ctx.message.text
  
  // Check feature flag
  if (!configService.get('featureFlags.smartGroupAI', true)) return
  
  try {
    // Process through smart orchestrator
    const result = await smartOrchestrator.processMessage(ctx, message)
    
    // Track unanswered questions for critical problems
    if (result.action === 'ignored' && message.includes('?')) {
      const key = `${groupId}_${userId}_${Date.now()}`
      smartOrchestrator.unansweredQuestions.set(key, {
        groupId,
        userId,
        message,
        ctx,
        timestamp: Date.now()
      })
    }
  } catch (err) {
    logger.error('Smart processing error:', err)
  }
})

// Callback handlers
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data
  logger.info(`Callback: ${data} from user ${ctx.from?.id}`)

  await ctx.answerCbQuery()

  switch (data) {
    case 'main_menu':
      await handleStart(ctx)
      break
    case 'tools_page_1':
    case 'tools_page_2':
    case 'tools_page_3':
    case 'tools_page_4':
    case 'tools_page_5':
      await handleToolsList(ctx)
      break
    case 'websites_page_1':
    case 'websites_page_2':
      await handleWebsites(ctx)
      break
    case 'smart_dashboard':
      if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
      await handleSmartDashboard(ctx)
      break
    case 'smart_incidents':
      if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
      break
    case 'smart_warnings':
      if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
      await handleWarningsList(ctx)
      break
    case 'smart_knowledge':
      if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
      await handleKnowledgeBase(ctx)
      break
    case 'admin_menu':
      if (!isAdmin(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
      await handleAdmin(ctx)
      break
    case 'admin_config':
      if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
      await handleAdminConfig(ctx)
      break
    case 'config_ai_providers':
      if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
      await handleAIProvidersList(ctx)
      break
    case 'config_add_provider':
      if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
      await handleAddProviderPrompt(ctx)
      break
    default:
      if (data.startsWith('tool_')) {
        await handleToolDetail(ctx)
      } else if (data === 'profile_view') {
        await handleProfile(ctx)
      } else if (data === 'search_prompt') {
        await handleSearchPrompt(ctx)
      } else if (data === 'help') {
        await handleHelp(ctx)
      } else if (data === 'admin_settings') {
        if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
        await handleSettings(ctx)
      } else if (data === 'admin_stats') {
        if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
        await handleStats(ctx)
      } else if (data === 'admin_welcome') {
        if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
        await handleWelcomeConfig(ctx)
      } else if (data === 'admin_tools') {
        if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
        await handleAdminTools(ctx)
      } else if (data === 'admin_add_tool') {
        if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
        await handleAddToolPrompt(ctx)
      } else if (data === 'admin_ads') {
        if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
        await handleAdminAds(ctx)
      } else if (data.startsWith('warning_')) {
        if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
        await require('./commands/smartWarnings').handleWarningAction(ctx)
      } else if (data.startsWith('test_provider_')) {
        if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
        await handleTestProvider(ctx)
      } else if (data.startsWith('refresh_models_')) {
        if (!isOwner(ctx)) { await ctx.reply('🚫 Unauthorized.'); return }
        await handleRefreshModels(ctx)
      }
      break
  }
})

// Handle config flows
bot.on('message', async (ctx) => {
  const userId = ctx.from?.id
  
  // Tool addition flow
  const toolFlow = addFlow[userId]
  if (toolFlow && isOwner(ctx)) {
    switch (toolFlow.step) {
      case 'name': await handleAddToolName(ctx); break
      case 'command': await handleAddToolCommand(ctx); break
      case 'category': await handleAddToolCategory(ctx); break
      case 'description': await handleAddToolDescription(ctx); break
      case 'github': await handleAddToolGitHub(ctx); break
      case 'download': await handleAddToolDownload(ctx); break
    }
    return
  }

  // Ad addition flow
  const adFlowState = adFlow[userId]
  if (adFlowState && isOwner(ctx)) {
    switch (adFlowState.step) {
      case 'name': await require('./commands/adminAds').handleAddAdName(ctx); break
      case 'provider': await require('./commands/adminAds').handleAddAdProvider(ctx); break
      case 'targetUrl': await require('./commands/adminAds').handleAddAdTarget(ctx); break
    }
    return
  }

  // Knowledge base flow
  const kbUserFlow = kbFlow[userId]
  if (kbUserFlow && isOwner(ctx)) {
    switch (kbUserFlow.step) {
      case 'question':
        await handleAddSolutionQuestion(ctx)
        break
      case 'answer':
        await handleAddSolutionAnswer(ctx)
        break
    }
    return
  }

  // AI Provider addition flow
  const providerFlow = configFlow[userId]
  if (providerFlow && isOwner(ctx)) {
    switch (providerFlow.step) {
      case 'provider_name':
        await handleAddProviderName(ctx)
        break
      case 'base_url':
        await handleAddProviderUrl(ctx)
        break
      case 'api_key':
        await handleAddProviderKey(ctx)
        break
    }
    return
  }

  // Search command
  if (ctx.message.text.startsWith('/search')) {
    await handleSearch(ctx)
    return
  }

  // AI commands
  if (ctx.message.text.startsWith('/ai')) {
    await handleAI(ctx)
    return
  }
  if (ctx.message.text.startsWith('/summarize')) {
    await handleSummarize(ctx)
    return
  }
  if (ctx.message.text.startsWith('/translate')) {
    await handleTranslate(ctx)
    return
  }
})

// Load all services and start bot
async function bootstrap() {
  await toolsService.load()
  await profileService.load()
  await websitesService.load()
  await welcomeService.load()
  await adminService.load()
  await aiService.loadProviders()
  await adsService.load()
  await downloadsService.load()
  await channelsService.load()
  await moderationService.load()
  await configService.load()
  await incidentManager.load()
  await spamDetector.load()
  await knowledgeBase.load()
  await githubService.load()

  // Register commands with Telegram
  const commands = [
    { command: 'start', description: 'Start the bot' },
    { command: 'help', description: 'Show help' },
    { command: 'profile', description: 'View developer profile' },
    { command: 'tools', description: 'List all tools' },
    { command: 'websites', description: 'List websites' },
    { command: 'search', description: 'Search tools' },
    { command: 'rules', description: 'View group rules' },
    { command: 'admin', description: 'Admin panel (owner only)' },
    { command: 'addtool', description: 'Add a tool (owner only)' },
    { command: 'ai', description: 'Ask AI a question' },
    { command: 'summarize', description: 'Summarize text with AI' },
    { command: 'translate', description: 'Translate text' },
    { command: 'settings', description: 'Bot settings (owner only)' },
    { command: 'stats', description: 'Statistics (owner only)' },
    { command: 'smart', description: 'Smart management dashboard (owner only)' },
    { command: 'warnings', description: 'Manage warnings (owner only)' },
    { command: 'knowledge', description: 'Knowledge base (owner only)' },
    { command: 'config', description: 'Configuration center (owner only)' },
  ]

  try {
    await bot.telegram.setMyCommands(commands)
    logger.info('Bot commands registered successfully')
  } catch (err) {
    logger.error('Failed to register commands:', err)
  }

  bot.launch()
  logger.info('Bot started successfully')

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))
}

bootstrap().then(async () => {
  try {
    await startWebServer()
  } catch (err) {
    logger.error('Failed to start web server:', err)
    // Bot still works without web server
  }
}).catch(err => {
  logger.error('Failed to start bot:', err)
  process.exit(1)
})

// Web server for Admin Panel / Telegram Mini App
async function startWebServer() {
  const app = express()
  const PORT = process.env.PORT || 3001
  
  app.use(express.json())
  app.use(express.static(path.join(__dirname, '../admin-panel')))
  app.use('/api', apiRouter)
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })
  
  // Admin Panel route
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin-panel/index.html'))
  })
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin-panel/index.html'))
  })
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Web server started on port ${PORT}`)
  })
  
  return server
}
