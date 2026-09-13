const path = require('path')
const fs = require('fs').promises
const logger = require('../../utils/logger')

const KB_FILE = path.join(__dirname, '../../../data/knowledge_base.json')

class KnowledgeBase {
  constructor() {
    this.solutions = []
    this.faqs = []
    this.documentation = []
  }

  async load() {
    try {
      const raw = await fs.readFile(KB_FILE, 'utf8')
      const data = JSON.parse(raw)
      this.solutions = data.solutions || []
      this.faqs = data.faqs || []
      this.documentation = data.documentation || []
    } catch {
      await this.save()
    }
  }

  async save() {
    await fs.writeFile(KB_FILE, JSON.stringify({
      solutions: this.solutions,
      faqs: this.faqs,
      documentation: this.documentation
    }, null, 2), 'utf8')
  }

  async addSolution(solution) {
    const doc = {
      id: `sol_${Date.now()}`,
      question: solution.question,
      answer: solution.answer,
      category: solution.category || 'general',
      tags: solution.tags || [],
      source: solution.source || 'manual',
      confidence: solution.confidence || 0.8,
      matches: solution.matches || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.solutions.push(doc)
    await this.save()
    return doc
  }

  async addFAQ(faq) {
    const doc = {
      id: `faq_${Date.now()}`,
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'general',
      createdAt: new Date().toISOString()
    }
    this.faqs.push(doc)
    await this.save()
    return doc
  }

  search(query, type = 'all') {
    const q = query.toLowerCase()
    let results = []
    
    if (type === 'all' || type === 'solutions') {
      results = results.concat(
        this.solutions.filter(s => 
          s.question.toLowerCase().includes(q) || 
          s.answer.toLowerCase().includes(q) ||
          s.tags.some(t => t.toLowerCase().includes(q))
        )
      )
    }
    
    if (type === 'all' || type === 'faqs') {
      results = results.concat(
        this.faqs.filter(f =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q)
        )
      )
    }
    
    return results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
  }

  incrementMatch(id) {
    const solution = this.solutions.find(s => s.id === id)
    if (solution) {
      solution.matches = (solution.matches || 0) + 1
      solution.updatedAt = new Date().toISOString()
      void this.save()
    }
  }
}

module.exports = new KnowledgeBase()
