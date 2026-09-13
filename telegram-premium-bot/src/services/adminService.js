const path = require('path')
const fs = require('fs').promises
const logger = require('../utils/logger')

const STATS_FILE = path.join(__dirname, '../../data/stats.json')

class AdminService {
  constructor() {
    this.stats = {
      users: new Set(),
      commands: {},
      downloads: 0
    }
  }

  async load() {
    try {
      const raw = await fs.readFile(STATS_FILE, 'utf8')
      const data = JSON.parse(raw)
      this.stats = {
        users: new Set(data.users || []),
        commands: data.commands || {},
        downloads: data.downloads || 0
      }
    } catch {
      await this.save()
    }
  }

  async save() {
    const data = {
      users: [...this.stats.users],
      commands: this.stats.commands,
      downloads: this.stats.downloads
    }
    await fs.writeFile(STATS_FILE, JSON.stringify(data, null, 2), 'utf8')
  }

  trackUser(userId) {
    this.stats.users.add(userId)
    void this.save()
  }

  trackCommand(cmd) {
    this.stats.commands[cmd] = (this.stats.commands[cmd] || 0) + 1
    void this.save()
  }

  trackDownload() {
    this.stats.downloads++
    void this.save()
  }

  getStats() {
    return {
      totalUsers: this.stats.users.size,
      totalDownloads: this.stats.downloads,
      commandUsage: { ...this.stats.commands }
    }
  }
}

module.exports = new AdminService()
