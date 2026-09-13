const express = require('express')
const path = require('path')
const configService = require('./services/config/configService')
const toolsService = require('./services/toolsService')
const adminService = require('./services/adminService')
const incidentManager = require('./services/smart/incidentManager')
const spamDetector = require('./services/smart/spamDetector')
const githubService = require('./services/smart/githubService')
const aiService = require('./services/aiService')

const router = express.Router()

// Static files
router.use(express.static(path.join(__dirname, '../../admin-panel')))

// Auth middleware
const requireAuth = (req, res, next) => {
  // In production, add proper auth
  next()
}

// Stats endpoint
router.get('/stats', requireAuth, async (req, res) => {
  const stats = adminService.getStats()
  res.json({
    users: stats.totalUsers,
    tools: toolsService.getAll().length,
    incidents: incidentManager.getOpenIncidents().length,
    warnings: spamDetector.getActiveWarnings().length
  })
})

// Tools endpoints
router.get('/tools', requireAuth, (req, res) => {
  res.json(toolsService.getAll())
})

router.post('/tools', requireAuth, async (req, res) => {
  try {
    const tool = await toolsService.add(req.body)
    res.json(tool)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/tools/:id', requireAuth, async (req, res) => {
  try {
    await toolsService.remove(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// AI Providers endpoints
router.get('/ai/providers', requireAuth, (req, res) => {
  res.json(configService.config.aiProviders || [])
})

router.post('/ai/providers', requireAuth, async (req, res) => {
  try {
    const provider = await configService.addAIProvider(req.body, req.headers['x-admin-id'] || 'web')
    res.json(provider)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/ai/providers/:id/test', requireAuth, async (req, res) => {
  try {
    const result = await configService.testProvider(req.params.id)
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/ai/providers/:id/models', requireAuth, async (req, res) => {
  try {
    const models = await configService.refreshModels(req.params.id)
    res.json(models)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GitHub endpoints
router.get('/github/repos', requireAuth, (req, res) => {
  res.json(configService.config.github?.connections || [])
})

router.post('/github/repos', requireAuth, async (req, res) => {
  try {
    const connection = await configService.addGitHubConnection(req.body, req.headers['x-admin-id'] || 'web')
    res.json(connection)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Audit log
router.get('/audit', requireAuth, (req, res) => {
  res.json(configService.getAuditLog(100))
})

// Configuration
router.get('/config', requireAuth, (req, res) => {
  res.json(configService.config)
})

router.put('/config/:key', requireAuth, async (req, res) => {
  try {
    await configService.set(req.params.key, req.body.value, req.headers['x-admin-id'] || 'web')
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

module.exports = router
