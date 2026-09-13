const path = require('path')
const fs = require('fs').promises
const crypto = require('crypto')
const logger = require('../../utils/logger')

const CONFIG_FILE = path.join(__dirname, '../../../data/configuration.json')
const AUDIT_FILE = path.join(__dirname, '../../../data/audit_log.json')

class ConfigService {
  constructor() {
    this.config = null
    this.auditLog = []
    this.encryptionKey = null
  }

  async load() {
    try {
      const raw = await fs.readFile(CONFIG_FILE, 'utf8')
      this.config = JSON.parse(raw)
    } catch {
      this.config = this.getDefaultConfig()
      await this.save()
    }
    await this.loadAuditLog()
  }

  async loadAuditLog() {
    try {
      const raw = await fs.readFile(AUDIT_FILE, 'utf8')
      this.auditLog = JSON.parse(raw)
    } catch {
      this.auditLog = []
    }
  }

  async saveAuditEntry(entry) {
    this.auditLog.push({
      ...entry,
      timestamp: new Date().toISOString(),
      id: `audit_${Date.now()}`
    })
    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000)
    }
    await fs.writeFile(AUDIT_FILE, JSON.stringify(this.auditLog, null, 2), 'utf8')
  }

  getDefaultConfig() {
    return {
      general: { appName: 'Telegram Premium Bot', version: '2.0.0', language: 'en' },
      aiProviders: [],
      models: { primary: '', fast: '', reasoning: '', fallback: '' },
      ads: { system1: { enabled: false, provider: '', credentials: {} }, system2: { enabled: false, provider: '', credentials: {} } },
      tools: {},
      github: { connections: [] },
      groupAI: {
        enabled: true,
        responseThreshold: 0.7,
        mentionRequired: true,
        unansweredTimeout: 300,
        criticalThreshold: 0.95,
        spamSensitivity: 'medium',
        warningThreshold: 3,
        autoModeration: 'conservative',
        cooldownSeconds: 60,
        maxResponsesPerMinute: 5
      },
      moderation: {
        spamThreshold: 5,
        warningCount: 3,
        muteThreshold: 3,
        banThreshold: 5,
        linkSpamDetection: true,
        floodDetection: true,
        duplicateDetection: true,
        autoModeration: false,
        humanApprovalRequired: true
      },
      featureFlags: {
        smartGroupAI: true,
        webResearch: true,
        githubSearch: true,
        toolDiscovery: true,
        autoModeration: false,
        ads: true,
        aiProvider: true,
        aiFallback: true,
        advancedAnalytics: true,
        incidentManagement: true,
        automaticWarning: false,
        automaticBan: false
      },
      database: { type: 'json', connectionString: '' },
      security: { encryptionEnabled: true, secretRotationDays: 90, maxLoginAttempts: 5 },
      notifications: { emailEnabled: false, telegramEnabled: true },
      logging: { level: 'info', retentionDays: 30, auditEnabled: true }
    }
  }

  async save() {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8')
  }

  get(key, defaultValue = null) {
    const keys = key.split('.')
    let value = this.config
    for (const k of keys) {
      if (value === undefined || value === null) return defaultValue
      value = value[k]
    }
    return value !== undefined ? value : defaultValue
  }

  async set(key, value, adminId, previousValue = null) {
    const keys = key.split('.')
    let obj = this.config
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]]
    }
    obj[keys[keys.length - 1]] = value
    
    await this.save()
    await this.saveAuditEntry({
      action: 'UPDATE',
      key,
      oldValue: previousValue,
      newValue: this.maskSecrets(value),
      adminId,
      success: true
    })
    
    logger.info(`Config updated: ${key} by admin ${adminId}`)
    return true
  }

  async addAIProvider(providerData, adminId) {
    const provider = {
      id: `provider_${Date.now()}`,
      name: providerData.name,
      baseUrl: providerData.baseUrl,
      apiKey: this.encrypt(providerData.apiKey),
      organizationId: providerData.organizationId || '',
      projectId: providerData.projectId || '',
      authType: providerData.authType || 'bearer',
      customHeaders: providerData.customHeaders || {},
      enabled: providerData.enabled !== undefined ? providerData.enabled : true,
      priority: providerData.priority || 0,
      timeout: providerData.timeout || 30000,
      maxRetries: providerData.maxRetries || 2,
      rateLimit: providerData.rateLimit || 60,
      health: 'unknown',
      lastChecked: null,
      createdAt: new Date().toISOString()
    }
    
    this.config.aiProviders.push(provider)
    await this.save()
    await this.saveAuditEntry({
      action: 'ADD_PROVIDER',
      key: `aiProviders.${provider.id}`,
      adminId,
      success: true
    })
    return provider
  }

  async updateAIProvider(providerId, updates, adminId) {
    const index = this.config.aiProviders.findIndex(p => p.id === providerId)
    if (index === -1) throw new Error('Provider not found.')
    
    const previous = { ...this.config.aiProviders[index] }
    this.config.aiProviders[index] = { ...this.config.aiProviders[index], ...updates }
    
    if (updates.apiKey) {
      this.config.aiProviders[index].apiKey = this.encrypt(updates.apiKey)
    }
    
    await this.save()
    await this.saveAuditEntry({
      action: 'UPDATE_PROVIDER',
      key: `aiProviders.${providerId}`,
      adminId,
      success: true
    })
    return this.config.aiProviders[index]
  }

  async testProvider(providerId) {
    const provider = this.config.aiProviders.find(p => p.id === providerId)
    if (!provider) throw new Error('Provider not found.')
    
    try {
      const startTime = Date.now()
      const response = await fetch(`${provider.baseUrl.replace(/\/chat\/completions$/, '')}/models`, {
        headers: {
          'Authorization': `Bearer ${this.decrypt(provider.apiKey)}`
        }
      })
      
      if (response.ok) {
        provider.health = 'online'
        provider.lastChecked = new Date().toISOString()
        provider.lastResponseTime = Date.now() - startTime
        await this.save()
        return { success: true, responseTime: provider.lastResponseTime }
      } else {
        provider.health = 'offline'
        await this.save()
        return { success: false, status: response.status }
      }
    } catch (err) {
      provider.health = 'offline'
      await this.save()
      return { success: false, error: err.message }
    }
  }

  async refreshModels(providerId) {
    const provider = this.config.aiProviders.find(p => p.id === providerId)
    if (!provider) throw new Error('Provider not found.')
    
    try {
      const response = await fetch(`${provider.baseUrl.replace(/\/chat\/completions$/, '')}/models`, {
        headers: {
          'Authorization': `Bearer ${this.decrypt(provider.apiKey)}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        provider.models = data.data || []
        provider.lastModelRefresh = new Date().toISOString()
        await this.save()
        return provider.models
      }
    } catch (err) {
      logger.error('Failed to refresh models:', err)
    }
    return []
  }

  async addGitHubConnection(repoData, adminId) {
    const connection = {
      id: `gh_${Date.now()}`,
      owner: repoData.owner,
      token: this.encrypt(repoData.token),
      repositories: repoData.repositories || [],
      enabled: true,
      searchEnabled: true,
      createdAt: new Date().toISOString()
    }
    
    this.config.github.connections.push(connection)
    await this.save()
    await this.saveAuditEntry({
      action: 'ADD_GITHUB',
      key: `github.connections.${connection.id}`,
      adminId,
      success: true
    })
    return connection
  }

  async exportConfig(excludeSecrets = true) {
    const exportable = JSON.parse(JSON.stringify(this.config))
    if (excludeSecrets) {
      this.maskExportedCredentials(exportable)
    }
    return exportable
  }

  async importConfig(configData, adminId) {
    // Validate and merge
    this.config = { ...this.getDefaultConfig(), ...configData }
    await this.save()
    await this.saveAuditEntry({
      action: 'IMPORT_CONFIG',
      adminId,
      success: true
    })
  }

  maskExportedCredentials(obj) {
    if (obj.aiProviders) {
      obj.aiProviders.forEach(p => {
        if (p.apiKey) p.apiKey = 'sk_************************'
      })
    }
    if (obj.github?.connections) {
      obj.github.connections.forEach(c => {
        if (c.token) c.token = 'ghp_************************'
      })
    }
    if (obj.ads) {
      Object.values(obj.ads).forEach(sys => {
        if (sys.credentials) {
          Object.keys(sys.credentials).forEach(k => {
            sys.credentials[k] = '********'
          })
        }
      })
    }
  }

  encrypt(text) {
    if (!text) return text
    const key = this.getEncryptionKey()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return `${iv.toString('hex')}:${encrypted}`
  }

  decrypt(encrypted) {
    if (!encrypted) return encrypted
    const key = this.getEncryptionKey()
    const [ivHex, encryptedText] = encrypted.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  getEncryptionKey() {
    if (!this.encryptionKey) {
      // Use a deterministic key from environment or generate one
      this.encryptionKey = crypto.scryptSync(settings.SECRET_KEY || 'default-secret', 'salt', 32)
    }
    return this.encryptionKey
  }

  maskSecrets(value) {
    if (typeof value === 'string' && value.length > 4) {
      return value.substring(0, 4) + '*'.repeat(Math.min(value.length - 4, 8))
    }
    return value
  }

  getAuditLog(limit = 50) {
    return this.auditLog.slice(-limit).reverse()
  }
}

const settings = require('../../config/settings')
module.exports = new ConfigService()
