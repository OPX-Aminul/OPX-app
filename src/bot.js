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
const { errorHandler } = require('./middleware/errorHandler')
const { ownerOnly, isOwner } = require('./middleware/auth')
const apiRouter = require('./api')
const handleStart = require('./commands/start')
const handleHelp = require('./commands/help')
const { handleToolsList } = require('./commands/tools')
const handleProfile = require('./commands/profile')
const { handleWebsites } = require('./commands/websites')
const { handleSearch, pendingSearch } = require('./commands/search')
const handleAdmin = require('./commands/admin')
const { handleRules } = require('./commands/welcome')
const handleSettings = require('./commands/settings')
const handleStats = require('./commands/stats')
const {
  handleAdminTools,
  addFlow,
  handleAddToolPrompt,
  handleAddToolName,
  handleAddToolCommand,
  handleAddToolCategory,
  handleAddToolDescription,
  handleAddToolGitHub,
  handleAddToolDownload
} = require('./commands/adminTools')
const { handleAdminAds, adFlow } = require('./commands/adminAds')
const { handleAI, handleSummarize, handleTranslate } = require('./commands/ai')
const { handleSmartDashboard } = require('./commands/smartDashboard')
const { handleWarningsList } = require('./commands/smartWarnings')
const { handleKnowledgeBase, handleAddSolutionQuestion, handleAddSolutionAnswer, kbFlow } = require('./commands/smartKnowledge')
const {
  handleAdminConfig,
  handleAddProviderName,
  handleAddProviderUrl,
  handleAddProviderKey,
  configFlow
} = require('./commands/adminConfig')
const handleCallbacks = require('./handlers/callbacks')
const { handleFlows } = require('./handlers/flows')

const bot = new Telegraf(settings.BOT_TOKEN)
bot.use(errorHandler)

bot.command('start', handleStart)
bot.command('help', handleHelp)
bot.command('profile', handleProfile)
bot.command('about', handleProfile)
bot.command('tools', handleToolsList)
bot.command('websites', handleWebsites)
bot.command('rules', handleRules)
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
bot.command('ads', ownerOnly(handleAdminAds))

bot.on('callback_query', handleCallbacks)

bot.on('message', async (ctx, next) => {
  const text = ctx.message?.text
  if (!text) return next()
  if (text.startsWith('/')) return next()

  const userId = ctx.from?.id
  if (pendingSearch.has(userId)) {
    await handleSearch(ctx)
    return
  }

  const handled = await handleFlows(ctx)
  if (handled) return

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

  const adFlowState = adFlow[userId]
  if (adFlowState && isOwner(ctx)) {
    switch (adFlowState.step) {
      case 'name': await require('./commands/adminAds').handleAddAdName(ctx); break
      case 'provider': await require('./commands/adminAds').handleAddAdProvider(ctx); break
      case 'targetUrl': await require('./commands/adminAds').handleAddAdTarget(ctx); break
    }
    return
  }

  const kbUserFlow = kbFlow[userId]
  if (kbUserFlow && isOwner(ctx)) {
    if (kbUserFlow.step === 'question') await handleAddSolutionQuestion(ctx)
    else if (kbUserFlow.step === 'answer') await handleAddSolutionAnswer(ctx)
    return
  }

  const providerFlow = configFlow[userId]
  if (providerFlow && isOwner(ctx)) {
    if (providerFlow.step === 'provider_name') await handleAddProviderName(ctx)
    else if (providerFlow.step === 'base_url') await handleAddProviderUrl(ctx)
    else if (providerFlow.step === 'api_key') await handleAddProviderKey(ctx)
    return
  }

  if (ctx.chat?.type === 'private') return
  if (!configService.get('featureFlags.smartGroupAI', true)) return

  try {
    const result = await smartOrchestrator.processMessage(ctx, text)
    if (result?.action === 'ignored' && text.includes('?')) {
      const key = `${ctx.chat.id}_${userId}_${Date.now()}`
      smartOrchestrator.unansweredQuestions.set(key, {
        groupId: ctx.chat.id,
        userId,
        message: text,
        ctx,
        timestamp: Date.now()
      })
    }
  } catch (err) {
    logger.error('Smart processing error:', err)
  }
})

async function registerMiniApp() {
  const publicUrl = settings.getPublicUrl()
  if (!publicUrl) {
    logger.warn('WEB_APP_URL / RENDER_EXTERNAL_URL not set. Mini App menu button skipped.')
    return
  }
  try {
    await bot.telegram.setChatMenuButton({
      menuButton: {
        type: 'web_app',
        text: 'Admin Panel',
        web_app: { url: `${publicUrl}/admin` }
      }
    })
    logger.info(`Mini App menu registered: ${publicUrl}/admin`)
  } catch (err) {
    logger.error('Failed to register Mini App menu:', err.message)
  }
}

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
    { command: 'config', description: 'Configuration center (owner only)' }
  ]

  try {
    await bot.telegram.setMyCommands(commands)
    logger.info('Bot commands registered successfully')
  } catch (err) {
    logger.error('Failed to register commands:', err)
  }

  await registerMiniApp()
  await bot.launch()
  logger.info('Bot started successfully')

  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))
}

async function startWebServer() {
  const app = express()
  const PORT = process.env.PORT || 3001
  const adminPanel = path.join(__dirname, '../admin-panel')

  app.use((req, res, next) => {
    if (!settings.getPublicUrl() && req.headers.host && !req.headers.host.startsWith('localhost')) {
      const proto = req.headers['x-forwarded-proto'] || 'https'
      process.env.WEB_APP_URL = `${proto}://${req.headers.host}`
      registerMiniApp().catch(() => {})
    }
    next()
  })

  app.use(express.json())
  app.use(express.static(adminPanel))
  app.use('/api', apiRouter)

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() })
  })

  const sendAdmin = (req, res) => {
    res.sendFile(path.join(adminPanel, 'index.html'))
  }
  app.get('/', sendAdmin)
  app.get('/admin', sendAdmin)
  app.get('/admin/', sendAdmin)

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Web server started on port ${PORT}`)
      resolve(server)
    })
    server.on('error', reject)
  })
}

bootstrap().then(async () => {
  try {
    await startWebServer()
  } catch (err) {
    logger.error('Failed to start web server:', err)
  }
}).catch(err => {
  logger.error('Failed to start bot:', err)
  process.exit(1)
})
