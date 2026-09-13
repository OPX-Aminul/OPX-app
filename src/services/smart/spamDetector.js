const path = require('path')
const fs = require('fs').promises
const logger = require('../../utils/logger')

const WARNINGS_FILE = path.join(__dirname, '../../../data/warnings.json')

class SpamDetector {
  constructor() {
    this.warnings = []
    this.userMessageCounts = new Map()
  }

  async load() {
    try {
      const raw = await fs.readFile(WARNINGS_FILE, 'utf8')
      this.warnings = JSON.parse(raw)
    } catch {
      this.warnings = []
      await this.save()
    }
  }

  async save() {
    await fs.writeFile(WARNINGS_FILE, JSON.stringify(this.warnings, null, 2), 'utf8')
  }

  trackMessage(userId, groupId, message) {
    const key = `${userId}_${groupId}`
    const now = Date.now()
    const record = this.userMessageCounts.get(key) || { count: 0, resetAt: now + 60000 }
    
    if (now > record.resetAt) {
      record.count = 0
      record.resetAt = now + 60000
    }
    
    record.count++
    this.userMessageCounts.set(key, record)
    
    // Check for spam patterns
    if (record.count > 10) {
      this.generateWarning(userId, groupId, 'excessive_messaging', `Sent ${record.count} messages in 1 minute`)
    }
  }

  async generateWarning(userId, groupId, reason, details = '') {
    const warning = {
      id: `warn_${Date.now()}`,
      userId,
      groupId,
      reason,
      details,
      confidence: 0.8,
      timestamp: new Date().toISOString(),
      status: 'active',
      previousWarnings: this.warnings.filter(w => w.userId === userId && w.status === 'active').length
    }
    
    this.warnings.push(warning)
    await this.save()
    logger.info(`Warning generated for user ${userId}: ${reason}`)
    return warning
  }

  async dismissWarning(warningId, adminId) {
    const index = this.warnings.findIndex(w => w.id === warningId)
    if (index !== -1) {
      this.warnings[index].status = 'dismissed'
      this.warnings[index].dismissedBy = adminId
      this.warnings[index].dismissedAt = new Date().toISOString()
      await this.save()
    }
  }

  async executeAction(warningId, action, adminId) {
    const warning = this.warnings.find(w => w.id === warningId)
    if (!warning) return null
    
    warning.action = action
    warning.executedBy = adminId
    warning.executedAt = new Date().toISOString()
    warning.status = 'resolved'
    
    await this.save()
    return warning
  }

  getUserWarnings(userId) {
    return this.warnings.filter(w => w.userId === userId && w.status === 'active')
  }

  getActiveWarnings() {
    return this.warnings.filter(w => w.status === 'active')
  }

  getStatistics() {
    return {
      total: this.warnings.length,
      active: this.warnings.filter(w => w.status === 'active').length,
      dismissed: this.warnings.filter(w => w.status === 'dismissed').length,
      resolved: this.warnings.filter(w => w.status === 'resolved').length
    }
  }
}

module.exports = new SpamDetector()
