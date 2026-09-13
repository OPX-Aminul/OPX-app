const settings = require('../config/settings')
const logger = require('../utils/logger')

class AIService {
  constructor() {
    this.providers = []
    this.contexts = new Map()
  }

  async loadProviders() {
    try {
      const fs = require('fs').promises
      const path = require('path')
      const providersFile = path.join(__dirname, '../../data/ai_providers.json')
      const raw = await fs.readFile(providersFile, 'utf8')
      this.providers = JSON.parse(raw)
    } catch {
      this.providers = []
    }
  }

  getEnabledProviders() {
    return this.providers.filter(p => p.enabled).sort((a, b) => a.priority - b.priority)
  }

  async chat(messages, options = {}) {
    const enabledProviders = this.getEnabledProviders()
    
    if (enabledProviders.length === 0) {
      throw new Error('No AI providers configured')
    }

    for (const provider of enabledProviders) {
      try {
        const response = await this.callProvider(provider, messages, options)
        provider.lastStatus = 'healthy'
        return response
      } catch (err) {
        logger.warn(`AI provider ${provider.name} failed: ${err.message}`)
        provider.lastStatus = 'unhealthy'
        
        if (provider.cooldownMs) {
          provider.lastFailure = Date.now()
        }
        
        if (provider === enabledProviders[enabledProviders.length - 1]) {
          throw new Error('All AI providers unavailable')
        }
      }
    }
  }

  async callProvider(provider, messages, options) {
    const timeout = options.timeout || provider.timeout || 30000
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const url = provider.baseUrl.endsWith('/chat/completions') 
        ? provider.baseUrl 
        : `${provider.baseUrl}/chat/completions`

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      }

      const body = {
        model: options.model || provider.model,
        messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`HTTP ${response.status}: ${error}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async summarize(text, options = {}) {
    const summary = await this.chat([
      { role: 'system', content: 'You are a helpful assistant that summarizes text concisely.' },
      { role: 'user', content: `Summarize the following text:\n\n${text}` }
    ], options)
    return summary
  }

  async translate(text, targetLanguage, options = {}) {
    const translation = await this.chat([
      { role: 'system', content: `Translate the following text to ${targetLanguage}.` },
      { role: 'user', content: text }
    ], options)
    return translation
  }

  async searchAndRespond(userMessage) {
    const toolsService = require('./toolsService')
    const tools = toolsService.search(userMessage)
    
    if (tools.length > 0) {
      let message = `🔎 Found matching tools:\n\n`
      tools.slice(0, 5).forEach((tool, idx) => {
        message += `${idx + 1}. **${tool.name}** (${tool.category})\n`
        if (tool.shortDescription) message += `   ${tool.shortDescription.substring(0, 60)}\n`
        message += `\n`
      })
      message += `\nUse /tool_name to see details.`
      return message
    }

    return await this.chat([
      { role: 'system', content: 'You are a helpful assistant for developer tools and resources.' },
      { role: 'user', content: userMessage }
    ])
  }

  async testProvider(providerId) {
    const provider = this.providers.find(p => p.id === providerId)
    if (!provider) throw new Error('Provider not found')

    try {
      const result = await this.callProvider(provider, [
        { role: 'user', content: 'Say hello in one word' }
      ], { maxTokens: 10 })
      provider.lastStatus = 'healthy'
      provider.lastTest = new Date().toISOString()
      return { success: true, response: result }
    } catch (err) {
      provider.lastStatus = 'unhealthy'
      provider.lastError = err.message
      return { success: false, error: err.message }
    }
  }
}

module.exports = new AIService()
