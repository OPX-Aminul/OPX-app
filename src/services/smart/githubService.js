const path = require('path')
const fs = require('fs').promises
const logger = require('../../utils/logger')

const GH_FILE = path.join(__dirname, '../../../data/github_repos.json')

class GithubService {
  constructor() {
    this.repositories = []
  }

  async load() {
    try {
      const raw = await fs.readFile(GH_FILE, 'utf8')
      this.repositories = JSON.parse(raw)
    } catch {
      this.repositories = []
      await this.save()
    }
  }

  async save() {
    await fs.writeFile(GH_FILE, JSON.stringify(this.repositories, null, 2), 'utf8')
  }

  async addRepository(repoData) {
    const repo = {
      id: repoData.id || `repo_${Date.now()}`,
      owner: repoData.owner,
      name: repoData.name,
      url: repoData.url || `https://github.com/${repoData.owner}/${repoData.name}`,
      token: repoData.token || '', // Store securely
      labels: repoData.labels || [],
      enabled: repoData.enabled !== undefined ? repoData.enabled : true,
      searchEnabled: repoData.searchEnabled !== undefined ? repoData.searchEnabled : true,
      createdAt: new Date().toISOString()
    }
    this.repositories.push(repo)
    await this.save()
    logger.info(`Added GitHub repository: ${repo.owner}/${repo.name}`)
    return repo
  }

  async update(id, updates) {
    const index = this.repositories.findIndex(r => r.id === id)
    if (index === -1) throw new Error('Repository not found.')
    this.repositories[index] = { ...this.repositories[index], ...updates }
    await this.save()
    return this.repositories[index]
  }

  async remove(id) {
    const index = this.repositories.findIndex(r => r.id === id)
    if (index === -1) throw new Error('Repository not found.')
    const removed = this.repositories.splice(index, 1)[0]
    await this.save()
    return removed
  }

  getEnabled() {
    return this.repositories.filter(r => r.enabled)
  }

  async searchRepo(repoId, query) {
    const repo = this.repositories.find(r => r.id === repoId)
    if (!repo) return []
    
    // In real implementation, use GitHub API
    // For now, return placeholder
    return []
  }

  async searchAllRepos(query) {
    const results = []
    for (const repo of this.getEnabled()) {
      const findings = await this.searchRepo(repo.id, query)
      results.push(...findings.map(f => ({ ...f, repoOwner: repo.owner, repoName: repo.name })))
    }
    return results
  }
}

module.exports = new GithubService()
