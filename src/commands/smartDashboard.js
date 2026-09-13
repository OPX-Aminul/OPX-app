const smartOrchestrator = require('../services/smart/aiOrchestrator')
const incidentManager = require('../services/smart/incidentManager')
const spamDetector = require('../services/smart/spamDetector')
const knowledgeBase = require('../services/smart/knowledgeBase')
const githubService = require('../services/smart/githubService')
const toolsService = require('../services/toolsService')
const logger = require('../utils/logger')

const handleSmartDashboard = async (ctx) => {
  const stats = smartOrchestrator.getStatistics()
  
  let msg = '🧠 SMART MANAGEMENT DASHBOARD\n\n'
  msg += '═══════════════════════════\n\n'
  
  // System health
  msg += '📊 SYSTEM HEALTH\n'
  msg += `• Incidents: ${stats.incidents.open} open, ${stats.incidents.resolved} resolved\n`
  msg += `• Warnings: ${stats.warnings.active} active\n`
  msg += `• Knowledge Base: ${stats.knowledgeBase.solutions} solutions\n`
  msg += `• GitHub Repos: ${stats.github.repos} connected (${stats.github.enabled} active)\n\n`
  
  // Tool usage
  const tools = toolsService.getAll()
  if (tools.length > 0) {
    msg += '🛠 TOOL USAGE\n'
    for (const t of tools.slice(0, 5)) {
      const toolStats = await getToolStats(t.id)
      msg += `• ${t.name}: ${toolStats.total} executions\n`
    }
    msg += '\n'
  }
  
  // Active incidents
  const openIncidents = incidentManager.getOpenIncidents()
  if (openIncidents.length > 0) {
    msg += '⚠️ OPEN INCIDENTS\n'
    openIncidents.slice(0, 3).forEach(i => {
      msg += `• [${i.severity}] ${i.id}\n`
    })
    msg += '\n'
  }
  
  // Recent warnings
  const recentWarnings = spamDetector.getActiveWarnings().slice(-3).reverse()
  if (recentWarnings.length > 0) {
    msg += '⚠️ RECENT WARNINGS\n'
    recentWarnings.forEach(w => {
      msg += `• User ${w.userId}: ${w.reason}\n`
    })
    msg += '\n'
  }
  
  msg += '═══════════════════════════\n'
  msg += 'Use admin commands to manage these systems.'
  
  await ctx.reply(msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📊 View Incidents', callback_data: 'smart_incidents' }],
        [{ text: '⚠️ Manage Warnings', callback_data: 'smart_warnings' }],
        [{ text: '📚 Knowledge Base', callback_data: 'smart_knowledge' }],
        [{ text: '🏠 Back', callback_data: 'admin_menu' }]
      ]
    }
  })
  
  logger.info(`Owner ${ctx.from?.id} viewed smart dashboard`)
}

async function getToolStats(toolId) {
  // Mock implementation - in real scenario would query execution history
  return { total: 0, successful: 0, failed: 0 }
}

module.exports = { handleSmartDashboard }
