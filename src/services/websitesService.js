const path = require('path')
const fs = require('fs').promises
const { paginate } = require('../utils/helpers')
const logger = require('../utils/logger')

const WEBSITES_FILE = path.join(__dirname, '../../data/websites.json')

class WebsitesService {
  constructor() { this.websites = [] }

  async load() {
    try {
      const raw = await fs.readFile(WEBSITES_FILE, 'utf8')
      this.websites = JSON.parse(raw)
    } catch {
      this.websites = []
      await this.save()
    }
  }

  async save() {
    await fs.writeFile(WEBSITES_FILE, JSON.stringify(this.websites, null, 2), 'utf8')
  }

  getAll() { return [...this.websites] }
  getById(id) { return this.websites.find(w => w.id === id) || null }

  async add(site) {
    const website = {
      id: site.id || `site_${Date.now()}`,
      name: site.name,
      description: site.description || '',
      url: site.url,
      category: site.category || 'General',
      status: site.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.websites.push(website)
    await this.save()
    return website
  }

  async update(id, updates) {
    const index = this.websites.findIndex(w => w.id === id)
    if (index === -1) throw new Error('Website not found.')
    this.websites[index] = { ...this.websites[index], ...updates, updatedAt: new Date().toISOString() }
    await this.save()
    return this.websites[index]
  }

  async remove(id) {
    const index = this.websites.findIndex(w => w.id === id)
    if (index === -1) throw new Error('Website not found.')
    const removed = this.websites.splice(index, 1)[0]
    await this.save()
    return removed
  }

  getPaginated(page = 1, perPage = 5) { return paginate(this.getAll(), page, perPage) }
}

module.exports = new WebsitesService()
