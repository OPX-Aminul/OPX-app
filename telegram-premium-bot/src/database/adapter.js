class DatabaseAdapter {
  async get(key) { throw new Error('Not implemented') }
  async set(key, value) { throw new Error('Not implemented') }
  async delete(key) { throw new Error('Not implemented') }
  async getAll() { throw new Error('Not implemented') }
}
module.exports = DatabaseAdapter
