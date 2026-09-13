const path = require('path')
const fs = require('fs').promises
const logger = require('../utils/logger')

const PROFILE_FILE = path.join(__dirname, '../../data/profile.json')

class ProfileService {
  constructor() {
    this.profile = null
  }

  async load() {
    try {
      const raw = await fs.readFile(PROFILE_FILE, 'utf8')
      this.profile = JSON.parse(raw)
      logger.info('Profile loaded successfully')
    } catch (err) {
      logger.warn('profile.json not found, using defaults')
      this.profile = this.getDefaultProfile()
      await this.save()
    }
  }

  getDefaultProfile() {
    return {
      name: 'Developer',
      username: '',
      bio: 'Building awesome things.',
      description: '',
      location: '',
      email: '',
      links: {
        github: '',
        telegram: '',
        website: '',
        portfolio: '',
        facebook: '',
        instagram: '',
        youtube: '',
        twitter: '',
        linkedin: '',
      },
    }
  }

  get() {
    return this.profile || this.getDefaultProfile()
  }

  async update(updates) {
    if (!this.profile) this.profile = this.getDefaultProfile()
    this.profile = { ...this.profile, ...updates }
    await this.save()
    return this.profile
  }

  async save() {
    await fs.writeFile(PROFILE_FILE, JSON.stringify(this.profile, null, 2), 'utf8')
  }
}

module.exports = new ProfileService()
