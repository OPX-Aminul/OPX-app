const express = require('express')
const path = require('path')
const crypto = require('crypto')
const configService = require('./services/config/configService')
const toolsService = require('./services/toolsService')
const adminService = require('./services/adminService')
const incidentManager = require('./services/smart/incidentManager')
const spamDetector = require('./services/smart/spamDetector')
const githubService = require('./services/smart/githubService')
const aiService = require('./services/aiService')
const adsService = require('./services/adsService')
const downloadsService = require('./services/downloadsService')
const channelsService = require('./services/channelsService')
const moderationService = require('./services/moderationService')

const router = express.Router()

// Path to admin panel (works both locally and in Render)
const ADMIN_PANEL_PATH = path.join(__dirname, '../admin-panel')

// Validate Telegram WebApp init data
const verifyTelegramAuth = async (req, res, next) => {
  try {
    const initData = req.headers['x-telegram-init-data'] || req.query.init_data
    
    if (!initData) {
      // Allow access without auth for health checks
      if (req.path === '/health') return next()
      return res.status(401).json({ error: 'Unauthorized - No init data' })
    }
    
    // Parse init data
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    const authDate = parseInt(params.get('auth_date'))
    const userStr = params.get('user')
    
    if (!userStr) {
      return res.status(401).json({ error: 'No user data' })
    }
    
    const user = JSON.parse(userStr)
    const ownerId = process.env.OWNER_ID || '8927024876'
    
    // Check if user is owner or admin
    if (user.id.toString() !== ownerId) {
      return res.status(403).json({ error: 'Forbidden - Not authorized' })
    }
    
    req.telegramUser = user
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid init data' })
  }
}

// Serve static files from admin-panel
router.use(express.static(ADMIN_PANEL_PATH))

// Stats endpoint
router.get('/stats', verifyTelegramAuth, async (req, res) => {
  const stats = adminService.getStats()
  res.json({
    users: stats.totalUsers || stats.users?.size || 0,
    commands: Object.keys(stats.commands || {}).length,
    downloads: stats.downloads || 0
  })
})

// Tools endpoints
router.get('/tools', verifyTelegramAuth, (req, res) => {
  res.json(toolsService.getAll())
})

router.post('/tools', verifyTelegramAuth, async (req, res) => {
  try {
    const tool = await toolsService.add(req.body)
    res.json(tool)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.put('/tools/:id', verifyTelegramAuth, async (req, res) => {
  try {
    const tool = await toolsService.update(req.params.id, req.body)
    res.json(tool)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/tools/:id', verifyTelegramAuth, async (req, res) => {
  try {
    await toolsService.remove(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Downloads endpoints
router.get('/downloads', verifyTelegramAuth, (req, res) => {
  res.json(downloadsService.getAll())
})

router.post('/downloads', verifyTelegramAuth, async (req, res) => {
  try {
    const download = await downloadsService.add(req.body)
    res.json(download)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.put('/downloads/:id', verifyTelegramAuth, async (req, res) => {
  try {
    const download = await downloadsService.update(req.params.id, req.body)
    res.json(download)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/downloads/:id', verifyTelegramAuth, async (req, res) => {
  try {
    await downloadsService.remove(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// AI Providers endpoints
router.get('/ai/providers', verifyTelegramAuth, (req, res) => {
  res.json(configService.config.aiProviders || [])
})

router.post('/ai/providers', verifyTelegramAuth, async (req, res) => {
  try {
    const provider = await configService.addAIProvider(req.body, req.telegramUser?.id || 'web')
    res.json(provider)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.put('/ai/providers/:id', verifyTelegramAuth, async (req, res) => {
  try {
    const provider = await configService.updateAIProvider(req.params.id, req.body, req.telegramUser?.id || 'web')
    res.json(provider)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/ai/providers/:id', verifyTelegramAuth, async (req, res) => {
  try {
    const index = configService.config.aiProviders.findIndex(p => p.id === req.params.id)
    if (index === -1) throw new Error('Provider not found')
    configService.config.aiProviders.splice(index, 1)
    await configService.save()
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/ai/providers/:id/test', verifyTelegramAuth, async (req, res) => {
  try {
    const result = await configService.testProvider(req.params.id)
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/ai/providers/:id/models', verifyTelegramAuth, async (req, res) => {
  try {
    const models = await configService.refreshModels(req.params.id)
    res.json(models)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Advertisements endpoints
router.get('/ads', verifyTelegramAuth, (req, res) => {
  res.json(adsService.getAll())
})

router.post('/ads', verifyTelegramAuth, async (req, res) => {
  try {
    const ad = await adsService.add(req.body)
    res.json(ad)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.put('/ads/:id', verifyTelegramAuth, async (req, res) => {
  try {
    const ad = await adsService.update(req.params.id, req.body)
    res.json(ad)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/ads/:id', verifyTelegramAuth, async (req, res) => {
  try {
    await adsService.remove(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GitHub endpoints
router.get('/github/repos', verifyTelegramAuth, (req, res) => {
  res.json(configService.config.github?.connections || [])
})

router.post('/github/repos', verifyTelegramAuth, async (req, res) => {
  try {
    const connection = await configService.addGitHubConnection(req.body, req.telegramUser?.id || 'web')
    res.json(connection)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/github/repos/:id', verifyTelegramAuth, async (req, res) => {
  try {
    const connections = configService.config.github?.connections || []
    const index = connections.findIndex(c => c.id === req.params.id)
    if (index === -1) throw new Error('Connection not found')
    connections.splice(index, 1)
    await configService.save()
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Channels endpoints
router.get('/channels', verifyTelegramAuth, (req, res) => {
  res.json(channelsService.getAll())
})

router.post('/channels', verifyTelegramAuth, async (req, res) => {
  try {
    const channel = await channelsService.add(req.body)
    res.json(channel)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.put('/channels/:id', verifyTelegramAuth, async (req, res) => {
  try {
    const channel = await channelsService.update(req.params.id, req.body)
    res.json(channel)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/channels/:id', verifyTelegramAuth, async (req, res) => {
  try {
    await channelsService.remove(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Moderation endpoints
router.get('/moderation/stats', verifyTelegramAuth, (req, res) => {
  res.json({
    warnings: moderationService.getActiveWarnings()?.length || 0,
    incidents: incidentManager.getOpenIncidents().length
  })
})

router.get('/moderation/warnings', verifyTelegramAuth, (req, res) => {
  res.json(spamDetector.getActiveWarnings() || [])
})

// Incidents endpoints
router.get('/incidents', verifyTelegramAuth, (req, res) => {
  res.json(incidentManager.getOpenIncidents() || [])
})

router.post('/incidents/:id/resolve', verifyTelegramAuth, async (req, res) => {
  try {
    await incidentManager.resolve(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Configuration endpoints
router.get('/config', verifyTelegramAuth, (req, res) => {
  res.json(configService.config)
})

router.put('/config/:key', verifyTelegramAuth, async (req, res) => {
  try {
    await configService.set(req.params.key, req.body.value, req.telegramUser?.id || 'web')
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Feature flags
router.get('/feature-flags', verifyTelegramAuth, (req, res) => {
  res.json(configService.config.featureFlags || {})
})

router.put('/feature-flags/:flag', verifyTelegramAuth, async (req, res) => {
  try {
    await configService.set(`featureFlags.${req.params.flag}`, req.body.enabled, req.telegramUser?.id || 'web')
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Audit log
router.get('/audit', verifyTelegramAuth, (req, res) => {
  res.json(configService.getAuditLog(100))
})

// Dashboard stats
router.get('/dashboard/stats', verifyTelegramAuth, async (req, res) => {
  const stats = await adminService.getStats()
  const tools = toolsService.getAll()
  const providers = configService.config.aiProviders || []
  const ads = adsService.getAll()
  const downloads = downloadsService.getAll()
  const channels = channelsService.getAll()
  const incidents = incidentManager.getOpenIncidents()
  const warnings = spamDetector.getActiveWarnings()
  
  res.json({
    totalUsers: stats.totalUsers || stats.users?.size || 0,
    totalTools: tools.length,
    enabledTools: tools.filter(t => t.enabled !== false).length,
    totalProviders: providers.length,
    onlineProviders: providers.filter(p => p.health === 'online').length,
    totalAds: ads.length,
    enabledAds: ads.filter(a => a.enabled).length,
    totalDownloads: downloads.length,
    enabledDownloads: downloads.filter(d => d.enabled).length,
    totalChannels: channels.length,
    openIncidents: incidents.length,
    activeWarnings: warnings?.length || 0,
    commandCount: Object.keys(stats.commands || {}).length,
    timestamp: new Date().toISOString()
  })
})

// Users list (from stats)
router.get('/users', verifyTelegramAuth, (req, res) => {
  const stats = adminService.getStats()
  res.json({
    total: stats.totalUsers || stats.users?.size || 0,
    users: [...(stats.users || [])]
  })
})

// Groups management
router.get('/groups', verifyTelegramAuth, (req, res) => {
  const smartConfig = configService.config.groupAI || {}
  res.json({
    smartGroups: Object.keys(smartConfig.groups || {}),
    totalCount: Object.keys(smartConfig.groups || {}).length
  })
})

// Health check (no auth required)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

module.exports = router
