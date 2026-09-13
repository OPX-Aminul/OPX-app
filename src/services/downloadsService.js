const path = require('path')
const fs = require('fs').promises
const crypto = require('crypto')
const logger = require('../utils/logger')

const DOWNLOADS_FILE = path.join(__dirname, '../../data/downloads.json')
const TOKENS_FILE = path.join(__dirname, '../../data/download_tokens.json')

class DownloadsService {
  constructor() {
    this.downloads = []
    this.tokens = {}
  }

  async load() {
    try {
      const raw = await fs.readFile(DOWNLOADS_FILE, 'utf8')
      this.downloads = JSON.parse(raw)
    } catch {
      this.downloads = []
      await this.save()
    }
  }

  async save() {
    await fs.writeFile(DOWNLOADS_FILE, JSON.stringify(this.downloads, null, 2), 'utf8')
  }

  async generateToken(downloadId, userId, expiresMinutes = 30) {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = Date.now() + (expiresMinutes * 60 * 1000)
    this.tokens[token] = {
      downloadId,
      userId,
      expiresAt,
      used: false
    }
    return token
  }

  async validateToken(token) {
    const record = this.tokens[token]
    if (!record) return null
    if (record.used) return null
    if (Date.now() > record.expiresAt) {
      delete this.tokens[token]
      return null
    }
    return record
  }

  async markTokenUsed(token) {
    if (this.tokens[token]) {
      this.tokens[token].used = true
    }
  }

  getAll() {
    return [...this.downloads]
  }

  async add(data) {
    return this.addDownload(data)
  }

  async update(id, updates) {
    const index = this.downloads.findIndex(d => d.id === id)
    if (index === -1) throw new Error('Download not found.')
    this.downloads[index] = { ...this.downloads[index], ...updates }
    await this.save()
    return this.downloads[index]
  }

  async remove(id) {
    const index = this.downloads.findIndex(d => d.id === id)
    if (index === -1) throw new Error('Download not found.')
    const removed = this.downloads.splice(index, 1)[0]
    await this.save()
    return removed
  }

  async addDownload(data) {
    const download = {
      id: data.id || `dl_${Date.now()}`,
      toolId: data.toolId,
      name: data.name,
      url: data.url,
      platform: data.platform || 'All',
      version: data.version || '1.0.0',
      fileSize: data.fileSize || '',
      description: data.description || '',
      enabled: data.enabled !== undefined ? data.enabled : true,
      requiresAd: data.requiresAd || false,
      adCampaign: data.adCampaign || null,
      createdAt: new Date().toISOString()
    }
    this.downloads.push(download)
    await this.save()
    return download
  }

  getByToolId(toolId) {
    return this.downloads.filter(d => d.toolId === toolId && d.enabled)
  }
}

module.exports = new DownloadsService()
