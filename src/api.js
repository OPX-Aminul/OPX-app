const express = require('express')
const crypto = require('crypto')
const settings = require('./config/settings')
const configService = require('./services/config/configService')
const toolsService = require('./services/toolsService')
const adminService = require('./services/adminService')
const incidentManager = require('./services/smart/incidentManager')
const spamDetector = require('./services/smart/spamDetector')
const adsService = require('./services/adsService')
const downloadsService = require('./services/downloadsService')
const channelsService = require('./services/channelsService')
const websitesService = require('./services/websitesService')
const profileService = require('./services/profileService')
const logger = require('./utils/logger')

const router = express.Router()

function parseInitData(initData) {
  if (!initData || typeof initData !== 'string') return null
  try {
    const params = new URLSearchParams(initData)
    const userStr = params.get('user')
    if (!userStr) return null
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

function validateInitData(initData) {
  if (!initData || !settings.BOT_TOKEN) return false
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return false
    params.delete('hash')
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(settings.BOT_TOKEN).digest()
    const calculated = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
    return calculated === hash
  } catch {
    return false
  }
}

function maskProvider(provider) {
  if (!provider) return provider
  const copy = { ...provider }
  if (copy.apiKey) copy.apiKey = '********'
  return copy
}

function maskGitHub(conn) {
  if (!conn) return conn
  const copy = { ...conn }
  if (copy.token) copy.token = '********'
  return copy
}

const requireAuth = (req, res, next) => {
  if (req.path === '/health') return next()

  const initData = req.headers['x-telegram-init-data'] || req.query.init_data
  const ownerId = settings.OWNER_ID ? String(settings.OWNER_ID) : ''

  if (initData) {
    const user = parseInitData(initData)
    const valid = validateInitData(initData)
    if (user && String(user.id) === ownerId) {
      req.telegramUser = user
      req.adminId = String(user.id)
      return next()
    }
    if (valid && user && String(user.id) !== ownerId) {
      return res.status(403).json({ error: 'Forbidden' })
    }
  }

  const secret = req.headers['x-admin-secret']
  if (settings.ADMIN_PANEL_SECRET && secret && secret === settings.ADMIN_PANEL_SECRET) {
    req.adminId = 'secret'
    return next()
  }

  if (!initData && settings.NODE_ENV !== 'production') {
    req.adminId = 'dev'
    return next()
  }

  if (initData) {
    const user = parseInitData(initData)
    if (user && String(user.id) === ownerId) {
      req.telegramUser = user
      req.adminId = String(user.id)
      return next()
    }
  }

  return res.status(401).json({ error: 'Unauthorized' })
}

router.use(requireAuth)

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() })
})

router.get('/stats', (req, res) => {
  const stats = adminService.getStats()
  res.json({
    users: stats.totalUsers,
    tools: toolsService.getAll().length,
    incidents: incidentManager.getOpenIncidents().length,
    warnings: spamDetector.getActiveWarnings().length,
    downloads: stats.totalDownloads
  })
})

router.get('/dashboard/stats', (req, res) => {
  const stats = adminService.getStats()
  const tools = toolsService.getAll()
  const providers = configService.config?.aiProviders || []
  const ads = adsService.getAll()
  const downloads = downloadsService.getAll()
  const channels = channelsService.getAll()
  res.json({
    totalUsers: stats.totalUsers,
    totalTools: tools.length,
    enabledTools: tools.filter(t => t.status !== 'disabled').length,
    totalProviders: providers.length,
    onlineProviders: providers.filter(p => p.health === 'online').length,
    totalAds: ads.length,
    enabledAds: ads.filter(a => a.enabled).length,
    totalDownloads: downloads.length,
    enabledDownloads: downloads.filter(d => d.enabled !== false).length,
    totalChannels: channels.length,
    openIncidents: incidentManager.getOpenIncidents().length,
    activeWarnings: spamDetector.getActiveWarnings().length,
    commandCount: Object.keys(stats.commandUsage || {}).length,
    timestamp: new Date().toISOString()
  })
})

router.get('/tools', (req, res) => res.json(toolsService.getAll()))

router.post('/tools', async (req, res) => {
  try {
    const tool = await toolsService.add(req.body)
    res.json(tool)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.put('/tools/:id', async (req, res) => {
  try {
    const tool = await toolsService.update(req.params.id, req.body)
    res.json(tool)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/tools/:id', async (req, res) => {
  try {
    await toolsService.remove(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/downloads', (req, res) => res.json(downloadsService.getAll()))

router.post('/downloads', async (req, res) => {
  try {
    const download = await downloadsService.add(req.body)
    res.json(download)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.put('/downloads/:id', async (req, res) => {
  try {
    const download = await downloadsService.update(req.params.id, req.body)
    res.json(download)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/downloads/:id', async (req, res) => {
  try {
    await downloadsService.remove(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/ai/providers', (req, res) => {
  res.json((configService.config?.aiProviders || []).map(maskProvider))
})

router.post('/ai/providers', async (req, res) => {
  try {
    const provider = await configService.addAIProvider(req.body, req.adminId || 'web')
    res.json(maskProvider(provider))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.put('/ai/providers/:id', async (req, res) => {
  try {
    const provider = await configService.updateAIProvider(req.params.id, req.body, req.adminId || 'web')
    res.json(maskProvider(provider))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/ai/providers/:id', async (req, res) => {
  try {
    const providers = configService.config.aiProviders || []
    const index = providers.findIndex(p => p.id === req.params.id)
    if (index === -1) throw new Error('Provider not found')
    providers.splice(index, 1)
    await configService.save()
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/ai/providers/:id/test', async (req, res) => {
  try {
    const result = await configService.testProvider(req.params.id)
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/ai/providers/:id/models', async (req, res) => {
  try {
    const models = await configService.refreshModels(req.params.id)
    res.json(models)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/ads', (req, res) => res.json(adsService.getAll()))

router.post('/ads', async (req, res) => {
  try {
    const ad = await adsService.add(req.body)
    res.json(ad)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.put('/ads/:id', async (req, res) => {
  try {
    const ad = await adsService.update(req.params.id, req.body)
    res.json(ad)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/ads/:id', async (req, res) => {
  try {
    await adsService.remove(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/github/repos', (req, res) => {
  res.json((configService.config?.github?.connections || []).map(maskGitHub))
})

router.post('/github/repos', async (req, res) => {
  try {
    const connection = await configService.addGitHubConnection(req.body, req.adminId || 'web')
    res.json(maskGitHub(connection))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/github/repos/:id', async (req, res) => {
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

router.get('/channels', (req, res) => res.json(channelsService.getAll()))

router.post('/channels', async (req, res) => {
  try {
    const channel = await channelsService.add(req.body)
    res.json(channel)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.put('/channels/:id', async (req, res) => {
  try {
    const channel = await channelsService.update(req.params.id, req.body)
    res.json(channel)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/channels/:id', async (req, res) => {
  try {
    await channelsService.remove(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/websites', (req, res) => res.json(websitesService.getAll()))

router.post('/websites', async (req, res) => {
  try {
    const site = await websitesService.add(req.body)
    res.json(site)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.put('/websites/:id', async (req, res) => {
  try {
    const site = await websitesService.update(req.params.id, req.body)
    res.json(site)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/websites/:id', async (req, res) => {
  try {
    await websitesService.remove(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/profile', (req, res) => res.json(profileService.get()))

router.put('/profile', async (req, res) => {
  try {
    const profile = await profileService.update(req.body)
    res.json(profile)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/moderation/warnings', (req, res) => res.json(spamDetector.getActiveWarnings() || []))
router.get('/incidents', (req, res) => res.json(incidentManager.getOpenIncidents() || []))

router.post('/incidents/:id/resolve', async (req, res) => {
  try {
    await incidentManager.resolve(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/config', (req, res) => {
  const cfg = JSON.parse(JSON.stringify(configService.config || {}))
  if (cfg.aiProviders) cfg.aiProviders = cfg.aiProviders.map(maskProvider)
  if (cfg.github?.connections) cfg.github.connections = cfg.github.connections.map(maskGitHub)
  res.json(cfg)
})

router.put('/config/:key', async (req, res) => {
  try {
    await configService.set(req.params.key, req.body.value, req.adminId || 'web')
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/feature-flags', (req, res) => res.json(configService.config?.featureFlags || {}))

router.put('/feature-flags/:flag', async (req, res) => {
  try {
    await configService.set(`featureFlags.${req.params.flag}`, req.body.enabled, req.adminId || 'web')
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/audit', (req, res) => res.json(configService.getAuditLog(100)))

router.get('/users', (req, res) => {
  const stats = adminService.getStats()
  res.json({ total: stats.totalUsers, users: [...(adminService.stats.users || [])] })
})

router.get('/groups', (req, res) => {
  const smartConfig = configService.config?.groupAI || {}
  res.json({
    smartGroups: Object.keys(smartConfig.groups || {}),
    totalCount: Object.keys(smartConfig.groups || {}).length
  })
})

router.use((err, req, res, next) => {
  logger.error('API error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

module.exports = router
