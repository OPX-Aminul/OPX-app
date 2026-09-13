const path = require('path')
const fs = require('fs').promises
const logger = require('../utils/logger')

const ADS_FILE = path.join(__dirname, '../../data/ads.json')
const PROVIDERS_FILE = path.join(__dirname, '../../data/ad_providers.json')

class AdsService {
  constructor() {
    this.ads = []
    this.providers = []
  }

  async load() {
    try {
      const raw = await fs.readFile(ADS_FILE, 'utf8')
      this.ads = JSON.parse(raw)
    } catch {
      this.ads = []
      await this.save()
    }
    try {
      const raw = await fs.readFile(PROVIDERS_FILE, 'utf8')
      this.providers = JSON.parse(raw)
    } catch {
      this.providers = []
      await this.saveProviders()
    }
  }

  async save() {
    await fs.writeFile(ADS_FILE, JSON.stringify(this.ads, null, 2), 'utf8')
  }

  async saveProviders() {
    await fs.writeFile(PROVIDERS_FILE, JSON.stringify(this.providers, null, 2), 'utf8')
  }

  async addAd(adData) {
    const ad = {
      id: adData.id || `ad_${Date.now()}`,
      name: adData.name,
      provider: adData.provider || 'telegram_ads',
      campaignId: adData.campaignId || '',
      adId: adData.adId || '',
      targetUrl: adData.targetUrl || '',
      displayType: adData.displayType || 'banner',
      duration: adData.duration || 5,
      enabled: adData.enabled !== undefined ? adData.enabled : true,
      priority: adData.priority || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.ads.push(ad)
    await this.save()
    return ad
  }

  async update(id, updates) {
    const index = this.ads.findIndex(a => a.id === id)
    if (index === -1) throw new Error('Ad not found.')
    this.ads[index] = { ...this.ads[index], ...updates, updatedAt: new Date().toISOString() }
    await this.save()
    return this.ads[index]
  }

  async remove(id) {
    const index = this.ads.findIndex(a => a.id === id)
    if (index === -1) throw new Error('Ad not found.')
    const removed = this.ads.splice(index, 1)[0]
    await this.save()
    return removed
  }

  getAll() {
    return [...this.ads]
  }

  async add(adData) {
    return this.addAd(adData)
  }

  getActiveAds() {
    return this.ads.filter(ad => ad.enabled)
  }

  getProvider(id) {
    return this.providers.find(p => p.id === id)
  }

  getProviders() {
    return this.providers
  }
}

module.exports = new AdsService()
