const path = require('path')
const fs = require('fs').promises
const { sanitizeCommand, paginate } = require('../utils/helpers')
const logger = require('../utils/logger')

const TOOLS_FILE = path.join(__dirname, '../../data/tools.json')

class ToolsService {
  constructor() {
    this.tools = []
  }

  async load() {
    try {
      const raw = await fs.readFile(TOOLS_FILE, 'utf8')
      this.tools = JSON.parse(raw)
      logger.info(`Loaded ${this.tools.length} tools from tools.json`)
    } catch (err) {
      logger.warn('tools.json not found or invalid, starting fresh')
      this.tools = []
      await this.save()
    }
  }

  async save() {
    await fs.writeFile(TOOLS_FILE, JSON.stringify(this.tools, null, 2), 'utf8')
  }

  getAll() {
    return [...this.tools]
  }

  getById(id) {
    return this.tools.find((t) => t.id === id) || null
  }

  getByCommand(command) {
    const sanitized = sanitizeCommand(command)
    return this.tools.find((t) => sanitizeCommand(t.command) === sanitized) || null
  }

  async add(toolData) {
    const tool = {
      id: sanitizeCommand(toolData.name || toolData.command),
      command: sanitizeCommand(toolData.command),
      name: toolData.name || toolData.command,
      shortDescription: toolData.shortDescription || '',
      description: toolData.description || '',
      category: toolData.category || 'Uncategorized',
      tags: Array.isArray(toolData.tags) ? toolData.tags : [],
      github: toolData.github || null,
      download: toolData.download || null,
      documentation: toolData.documentation || null,
      website: toolData.website || null,
      demo: toolData.demo || null,
      usage: toolData.usage || '',
      installation: toolData.installation || '',
      requirements: toolData.requirements || '',
      author: toolData.author || '',
      version: toolData.version || '1.0.0',
      status: toolData.status || 'active',
      thumbnail: toolData.thumbnail || null,
      video: toolData.video || null,
      links: toolData.links || [],
      createdAt: toolData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (this.tools.some((t) => t.command === tool.command)) {
      throw new Error(`Command "${tool.command}" already exists.`)
    }

    this.tools.push(tool)
    await this.save()
    logger.info(`Added tool: ${tool.name}`)
    return tool
  }

  async update(id, updates) {
    const index = this.tools.findIndex((t) => t.id === id)
    if (index === -1) throw new Error('Tool not found.')

    const existing = this.tools[index]
    this.tools[index] = {
      ...existing,
      ...updates,
      id: existing.id,
      command: existing.command,
      updatedAt: new Date().toISOString(),
    }

    await this.save()
    logger.info(`Updated tool: ${id}`)
    return this.tools[index]
  }

  async remove(id) {
    const index = this.tools.findIndex((t) => t.id === id)
    if (index === -1) throw new Error('Tool not found.')

    const removed = this.tools.splice(index, 1)[0]
    await this.save()
    logger.info(`Deleted tool: ${removed.name}`)
    return removed
  }

  search(query) {
    if (!query) return this.getAll()
    const q = query.toLowerCase()
    return this.tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        t.author.toLowerCase().includes(q)
    )
  }

  getCategories() {
    const cats = new Set(this.tools.map((t) => t.category).filter(Boolean))
    return Array.from(cats).sort()
  }

  getPaginated(page = 1, perPage = 5) {
    return paginate(this.getAll(), page, perPage)
  }
}

module.exports = new ToolsService()
