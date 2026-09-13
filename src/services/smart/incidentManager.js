const path = require('path')
const fs = require('fs').promises
const logger = require('../../utils/logger')

const INCIDENTS_FILE = path.join(__dirname, '../../../data/incidents.json')

class IncidentManager {
  constructor() {
    this.incidents = []
  }

  async load() {
    try {
      const raw = await fs.readFile(INCIDENTS_FILE, 'utf8')
      this.incidents = JSON.parse(raw)
    } catch {
      this.incidents = []
      await this.save()
    }
  }

  async save() {
    await fs.writeFile(INCIDENTS_FILE, JSON.stringify(this.incidents, null, 2), 'utf8')
  }

  async createIncident(data) {
    const incident = {
      id: `inc_${Date.now()}`,
      severity: data.severity || 'medium',
      type: data.type || 'technical',
      status: data.status || 'OPEN',
      group: data.group || null,
      users: data.users || [],
      messages: data.messages || [],
      tools: data.tools || [],
      errors: data.errors || [],
      aiAnalysis: data.aiAnalysis || '',
      recommendedAction: data.recommendedAction || '',
      timeline: data.timeline || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    this.incidents.push(incident)
    await this.save()
    logger.info(`Incident created: ${incident.id}`)
    return incident
  }

  async updateStatus(id, status, adminAction = null) {
    const index = this.incidents.findIndex(i => i.id === id)
    if (index === -1) throw new Error('Incident not found.')
    
    this.incidents[index].status = status
    this.incidents[index].updatedAt = new Date().toISOString()
    
    if (adminAction) {
      this.incidents[index].adminActions = this.incidents[index].adminActions || []
      this.incidents[index].adminActions.push({
        action: adminAction,
        timestamp: new Date().toISOString()
      })
    }
    
    await this.save()
    return this.incidents[index]
  }

  async addTimelineEvent(incidentId, event) {
    const index = this.incidents.findIndex(i => i.id === incidentId)
    if (index === -1) return null
    
    if (!this.incidents[index].timeline) {
      this.incidents[index].timeline = []
    }
    
    this.incidents[index].timeline.push({
      ...event,
      timestamp: new Date().toISOString()
    })
    
    await this.save()
    return this.incidents[index]
  }

  getOpenIncidents() {
    return this.incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING')
  }

  getIncident(id) {
    return this.incidents.find(i => i.id === id)
  }

  getStatistics() {
    return {
      total: this.incidents.length,
      open: this.incidents.filter(i => i.status === 'OPEN').length,
      investigating: this.incidents.filter(i => i.status === 'INVESTIGATING').length,
      resolved: this.incidents.filter(i => i.status === 'RESOLVED').length,
      closed: this.incidents.filter(i => i.status === 'CLOSED').length,
      bySeverity: {
        critical: this.incidents.filter(i => i.severity === 'critical').length,
        high: this.incidents.filter(i => i.severity === 'high').length,
        medium: this.incidents.filter(i => i.severity === 'medium').length,
        low: this.incidents.filter(i => i.severity === 'low').length
      }
    }
  }
}

module.exports = new IncidentManager()
