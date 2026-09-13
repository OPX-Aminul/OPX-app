const toolsService = require('../toolsService')
const knowledgeBase = require('./knowledgeBase')
const githubService = require('./githubService')
const logger = require('../../utils/logger')

class ToolMatcher {
  constructor() {
    this.executionHistory = []
  }

  async findTool(query) {
    const lowerQuery = query.toLowerCase()
    
    // 1. Search in existing tool registry
    const tools = toolsService.getAll()
    const matchedTools = tools.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery) ||
      t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      t.category?.toLowerCase().includes(lowerQuery)
    )
    
    if (matchedTools.length > 0) {
      return { type: 'existing', tools: matchedTools }
    }
    
    // 2. Search knowledge base
    const kbResults = knowledgeBase.search(query)
    if (kbResults.length > 0) {
      return { type: 'knowledge', solutions: kbResults }
    }
    
    // 3. Search GitHub repositories
    const ghResults = await githubService.searchAllRepos(query)
    if (ghResults.length > 0) {
      return { type: 'github', results: ghResults }
    }
    
    return { type: 'none', query }
  }

  trackExecution(toolId, userId, groupId, status, duration, error = null) {
    const record = {
      id: `exec_${Date.now()}`,
      toolId,
      userId,
      groupId,
      status,
      duration,
      error,
      timestamp: new Date().toISOString()
    }
    this.executionHistory.push(record)
    // Keep only last 1000 records
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(-1000)
    }
    return record
  }

  getToolStats(toolId) {
    const executions = this.executionHistory.filter(e => e.toolId === toolId)
    const successful = executions.filter(e => e.status === 'success').length
    const failed = executions.filter(e => e.status === 'failed').length
    
    const avgDuration = executions.length > 0
      ? executions.reduce((sum, e) => sum + e.duration, 0) / executions.length
      : 0
    
    return {
      total: executions.length,
      successful,
      failed,
      successRate: executions.length > 0 ? (successful / executions.length) * 100 : 0,
      averageDuration: avgDuration
    }
  }
}

module.exports = new ToolMatcher()
