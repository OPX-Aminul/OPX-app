const aiClassifier = require('./aiClassifier')
const toolMatcher = require('./toolMatcher')
const knowledgeBase = require('./knowledgeBase')
const githubService = require('./githubService')
const incidentManager = require('./incidentManager')
const spamDetector = require('./spamDetector')
const aiService = require('../aiService')
const logger = require('../../utils/logger')

class AIOrchestrator {
  constructor() {
    this.activeIncidents = new Map()
    this.unansweredQuestions = new Map()
  }

  async processMessage(ctx, message) {
    const userId = ctx.from?.id
    const groupId = ctx.chat?.id
    const classification = aiClassifier.classify(message)
    const confidence = aiClassifier.getConfidence(classification, message)
    
    // Track in spam detector
    spamDetector.trackMessage(userId, groupId, message)
    
    // Log the classification for admin visibility
    logger.info(`Message classified as ${classification} (confidence: ${confidence}) from user ${userId}`)
    
    // Handle different classifications
    switch (classification) {
      case 'SPAM':
        await this.handleSpam(ctx, userId, message, confidence)
        return { action: 'blocked', reason: 'spam' }
      
      case 'ABUSE':
        await this.handleAbuse(ctx, userId, message, confidence)
        return { action: 'blocked', reason: 'abuse' }
      
      case 'NORMAL_CHAT':
        // Silent - don't reply
        return { action: 'ignored', reason: 'normal_chat' }
      
      case 'LOW_VALUE':
        // Ignore low value messages
        return { action: 'ignored', reason: 'low_value' }
      
      case 'DIRECT_AI_REQUEST':
      case 'QUESTION':
      case 'TECHNICAL_PROBLEM':
      case 'CRITICAL_PROBLEM':
      case 'ERROR_REPORT':
        return await this.handleIntelligentResponse(ctx, message, classification, userId, groupId)
      
      case 'TOOL_REQUEST':
        return await this.handleToolRequest(ctx, message, userId, groupId)
      
      default:
        return { action: 'ignored', reason: 'unknown' }
    }
  }

  async handleIntelligentResponse(ctx, message, classification, userId, groupId) {
    const startTime = Date.now()
    
    // Step 1: Search existing knowledge
    const kbResults = knowledgeBase.search(message)
    if (kbResults.length > 0) {
      const bestMatch = kbResults[0]
      knowledgeBase.incrementMatch(bestMatch.id)
      
      const response = `✅ **Existing Solution Found:**\n\n${bestMatch.answer}\n\n*Source: Knowledge Base*`
      
      await ctx.reply(response, { parse_mode: 'Markdown' })
      return { 
        action: 'responded', 
        source: 'knowledge_base',
        solutionId: bestMatch.id,
        duration: Date.now() - startTime
      }
    }
    
    // Step 2: Check if problem is critical/unanswered
    if (['CRITICAL_PROBLEM', 'TECHNICAL_PROBLEM'].includes(classification)) {
      const incident = await incidentManager.createIncident({
        severity: classification === 'CRITICAL_PROBLEM' ? 'critical' : 'high',
        type: 'technical_problem',
        group: groupId,
        users: [userId],
        messages: [message],
        aiAnalysis: `Classified as ${classification}`
      })
      
      // For critical incidents, notify admin instead of replying to group
      if (classification === 'CRITICAL_PROBLEM') {
        const settings = require('../../config/settings')
        await ctx.telegram.sendMessage(settings.OWNER_ID, 
          `⚠️ **Critical Incident Detected**\n\nIncident ID: ${incident.id}\nGroup: ${groupId}\nMessage: ${message.substring(0, 200)}`
        )
        return { action: 'escalated', incidentId: incident.id }
      }
    }
    
    // Step 3: Search GitHub repositories
    const ghRepos = githubService.getEnabled()
    if (ghRepos.length > 0) {
      const ghResults = await githubService.searchAllRepos(message)
      if (ghResults.length > 0) {
        let response = '🔍 **GitHub Repository Match:**\n\n'
        ghResults.slice(0, 3).forEach((result, idx) => {
          response += `${idx + 1}. **${result.repoOwner}/${result.repoName}**\n`
          if (result.file) response += `   File: \`${result.file}\`\n`
          response += '\n'
        })
        await ctx.reply(response)
        return { action: 'responded', source: 'github', matches: ghResults.length }
      }
    }
    
    // Step 4: Use AI to generate response
    try {
      const response = await aiService.chat([
        { role: 'system', content: 'You are a helpful assistant for developer tools. Provide concise, accurate answers based on available information.' },
        { role: 'user', content: message }
      ], { maxTokens: 500 })
      
      await ctx.reply(response.substring(0, 4096))
      
      // Store useful responses in knowledge base
      if (response.length > 50) {
        await knowledgeBase.addSolution({
          question: message,
          answer: response.substring(0, 500),
          category: classification.toLowerCase(),
          source: 'ai_generated',
          confidence: 0.7
        })
      }
      
      return { 
        action: 'responded', 
        source: 'ai',
        duration: Date.now() - startTime 
      }
    } catch (err) {
      logger.error('AI response failed:', err)
      await ctx.reply('⚠️ AI service temporarily unavailable.')
      return { action: 'failed', error: err.message }
    }
  }

  async handleToolRequest(ctx, message, userId, groupId) {
    const result = await toolMatcher.findTool(message)
    
    if (result.type === 'existing' && result.tools.length > 0) {
      const toolNames = result.tools.map(t => t.name).join(', ')
      await ctx.reply(`🛠 **Tools found for "${message}":**\n\n${toolNames}\n\nUse \`/<tool_command>\` to view details.`)
      return { action: 'responded', type: 'tools', count: result.tools.length }
    }
    
    if (result.type === 'github' && result.results.length > 0) {
      let response = '🔧 **Potential Tools from GitHub:**\n\n'
      result.results.slice(0, 3).forEach((r, idx) => {
        response += `${idx + 1}. ${r.repoOwner}/${r.repoName}\n`
      })
      response += '\n*These tools need admin approval before use.*'
      await ctx.reply(response)
      return { action: 'suggest', type: 'external_tools', count: result.results.length }
    }
    
    await ctx.reply('🔍 No matching tools found. Try specifying a category or keywords.')
    return { action: 'not_found' }
  }

  async handleSpam(ctx, userId, message, confidence) {
    const warning = await spamDetector.generateWarning(userId, ctx.chat?.id, 'spam_detection', message.substring(0, 100))
    
    if (warning.previousWarnings >= 2) {
      // Auto-mute after multiple warnings
      await ctx.reply('🚫 You have been muted for repeated spam behavior. Contact an admin to restore access.')
    } else {
      await ctx.reply(`⚠️ Warning ${warning.previousWarnings + 1}: Spam detected. Please follow group rules.`)
    }
    
    return { action: 'warned', warningId: warning.id }
  }

  async handleAbuse(ctx, userId, message, confidence) {
    const warning = await spamDetector.generateWarning(userId, ctx.chat?.id, 'abuse', message.substring(0, 100))
    await ctx.reply('🚫 Abusive behavior detected. This will be reported to administrators.')
    
    // Create incident for abuse
    await incidentManager.createIncident({
      severity: 'high',
      type: 'abuse',
      users: [userId],
      messages: [message],
      aiAnalysis: 'Abusive language detected'
    })
    
    return { action: 'reported', warningId: warning.id }
  }

  // Monitor unanswered questions
  async monitorUnanswered(groupId, minMinutes = 5) {
    const now = Date.now()
    const threshold = minMinutes * 60 * 1000
    
    for (const [key, data] of this.unansweredQuestions) {
      if (data.groupId === groupId && now - data.timestamp > threshold) {
        // Question has been unanswered for too long
        await this.checkForUnansweredSolution(key, data)
      }
    }
  }

  async checkForUnansweredSolution(questionKey, questionData) {
    // Search for solutions again
    const results = knowledgeBase.search(questionData.message)
    if (results.length > 0) {
      await questionData.ctx.reply(`💡 Solution found for your question:\n\n${results[0].answer}`)
      this.unansweredQuestions.delete(questionKey)
    }
  }

  getStatistics() {
    return {
      incidents: incidentManager.getStatistics(),
      warnings: spamDetector.getStatistics(),
      knowledgeBase: {
        solutions: knowledgeBase.solutions.length,
        faqs: knowledgeBase.faqs.length
      },
      github: {
        repos: githubService.repositories.length,
        enabled: githubService.getEnabled().length
      }
    }
  }
}

module.exports = new AIOrchestrator()
