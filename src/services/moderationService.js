const path = require('path')
const fs = require('fs').promises
const logger = require('../utils/logger')

const MODERATION_FILE = path.join(__dirname, '../../data/moderation.json')

class ModerationService {
  constructor() {
    this.config = null
    this.messageCounts = new Map()
    this.warnings = new Map()
  }

  async load() {
    try {
      const raw = await fs.readFile(MODERATION_FILE, 'utf8')
      this.config = JSON.parse(raw)
    } catch {
      this.config = this.getDefaultConfig()
      await this.save()
    }
  }

  getDefaultConfig() {
    return {
      antiSpam: { enabled: true, maxMessagesPerMinute: 5, action: 'warn' },
      floodProtection: { enabled: true, cooldownMs: 1000 },
      linkFiltering: { enabled: false, allowedDomains: [] },
      badWordFiltering: { enabled: false, words: [] },
      warnings: { maxWarnings: 3, action: 'mute' }
    }
  }

  async save() {
    await fs.writeFile(MODERATION_FILE, JSON.stringify(this.config, null, 2), 'utf8')
  }

  async checkMessage(ctx, message) {
    if (!this.config) await this.load()
    
    const userId = ctx.from?.id
    const now = Date.now()

    // Anti-spam check
    if (this.config.antiSpam.enabled) {
      const count = this.messageCounts.get(userId) || { count: 0, resetAt: now + 60000 }
      
      if (now > count.resetAt) {
        count.count = 0
        count.resetAt = now + 60000
      }
      
      count.count++
      this.messageCounts.set(userId, count)

      if (count.count > this.config.antiSpam.maxMessagesPerMinute) {
        await this.handleViolation(ctx, userId, 'spam')
        return false
      }
    }

    // Link filtering
    if (this.config.linkFiltering.enabled && message.includes('http')) {
      const urlMatch = message.match(/https?:\/\/\S+/g)
      if (urlMatch) {
        const hasAllowedDomain = urlMatch.some(url => {
          try {
            const domain = new URL(url).hostname
            return this.config.linkFiltering.allowedDomains.includes(domain)
          } catch {
            return false
          }
        })
        if (!hasAllowedDomain) {
          await this.handleViolation(ctx, userId, 'link')
          return false
        }
      }
    }

    return true
  }

  async handleViolation(ctx, userId, type) {
    const warnings = this.warnings.get(userId) || 0
    
    if (type === 'spam' || type === 'link') {
      this.warnings.set(userId, warnings + 1)
      
      if (warnings + 1 >= this.config.warnings.maxWarnings) {
        // Apply mute or kick
        logger.info(`User ${userId} muted for repeated violations`)
        this.warnings.delete(userId)
        // Note: Actual mute/kick requires bot admin permissions
      } else {
        await ctx.reply(`⚠️ Warning ${warnings + 1}/${this.config.warnings.maxWarnings}: ${this.getViolationMessage(type)}`)
      }
    }
  }

  getViolationMessage(type) {
    switch (type) {
      case 'spam': return 'Spam detected. Please slow down.'
      case 'link': return 'Links are not allowed in this chat.'
      default: return 'Violation detected.'
    }
  }

  async updateConfig(updates) {
    this.config = { ...this.config, ...updates }
    await this.save()
    return this.config
  }
}

module.exports = new ModerationService()
