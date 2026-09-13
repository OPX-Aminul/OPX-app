const fs = require('fs')
const path = require('path')
const DatabaseAdapter = require('./adapter')
const logger = require('../utils/logger')

class JsonAdapter extends DatabaseAdapter {
  constructor(dataDir) {
    super()
    this.dataDir = dataDir || path.join(__dirname, '../../data')
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }
  }
  _filePath(key) { return path.join(this.dataDir, `${key}.json`) }

  async get(key) {
    try {
      const filePath = this._filePath(key)
      if (!fs.existsSync(filePath)) return null
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (err) {
      logger.error(`[JSON DB] Error reading ${key}:`, err.message)
      return null
    }
  }

  async set(key, value) {
    try {
      fs.writeFileSync(this._filePath(key), JSON.stringify(value, null, 2), 'utf8')
      return true
    } catch (err) {
      logger.error(`[JSON DB] Error writing ${key}:`, err.message)
      return false
    }
  }

  async delete(key) {
    try {
      const filePath = this._filePath(key)
      if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); return true }
      return false
    } catch (err) {
      logger.error(`[JSON DB] Error deleting ${key}:`, err.message)
      return false
    }
  }

  async getAll() {
    try {
      const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'))
      const result = {}
      for (const file of files) {
        result[file.replace('.json', '')] = await this.get(file.replace('.json', ''))
      }
      return result
    } catch (err) {
      logger.error('[JSON DB] Error reading all keys:', err.message)
      return {}
    }
  }
}
module.exports = JsonAdapter
