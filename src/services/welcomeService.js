const path = require('path')
const fs = require('fs').promises
const logger = require('../utils/logger')

const SETTINGS_FILE = path.join(__dirname, '../../data/settings.json')

class WelcomeService {
  constructor() {
    this.settings = {
      welcomeEnabled: true,
      welcomeDeleteAfter: 10,
      welcomeMessage: '🎉 Welcome {firstName}!\n\nWelcome to {groupName}.\n\nEnjoy your stay! 🚀',
    }
  }

  async load() {
    try {
      const raw = await fs.readFile(SETTINGS_FILE, 'utf8')
      const allSettings = JSON.parse(raw)
      this.settings = { ...this.settings, ...allSettings.welcome, ...allSettings }
    } catch (err) {
      logger.warn('settings.json not found, using defaults')
      await this.save()
    }
  }

  async save() {
    try {
      const raw = await fs.readFile(SETTINGS_FILE, 'utf8')
      const allSettings = JSON.parse(raw)
      allSettings.welcome = this.settings
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(allSettings, null, 2), 'utf8')
    } catch {
      await fs.writeFile(SETTINGS_FILE, JSON.stringify({ welcome: this.settings }, null, 2), 'utf8')
    }
  }

  get() {
    return this.settings
  }

  async enable() {
    this.settings.welcomeEnabled = true
    await this.save()
  }

  async disable() {
    this.settings.welcomeEnabled = false
    await this.save()
  }

  async setMessage(msg) {
    this.settings.welcomeMessage = msg
    await this.save()
  }

  async setDeleteAfter(seconds) {
    this.settings.welcomeDeleteAfter = Math.max(5, Math.min(300, parseInt(seconds, 10) || 10))
    await this.save()
  }
}

module.exports = new WelcomeService()
