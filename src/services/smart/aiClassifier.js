class AIClassifier {
  constructor() {
    this.classifications = {}
  }

  classify(message) {
    const lower = message.toLowerCase()
    
    // Check for direct AI requests
    if (lower.includes('@bot') || lower.startsWith('/ai') || lower.includes('সাহায্য')) {
      return 'DIRECT_AI_REQUEST'
    }
    
    // Check for questions
    if (message.includes('?') || lower.includes('কিভাবে') || lower.includes('কেন') || 
        lower.includes('কোন') || lower.includes('কী') || lower.includes('তুমি')) {
      return 'QUESTION'
    }
    
    // Check for technical problems
    if (lower.includes('error') || lower.includes('bug') || lower.includes('problem') ||
        lower.includes('কাজ করছে না') || lower.includes('ভুল') || lower.includes('এরর')) {
      return 'TECHNICAL_PROBLEM'
    }
    
    // Check for critical issues
    if (lower.includes('critical') || lower.includes('urgent') || lower.includes('হিট')) {
      return 'CRITICAL_PROBLEM'
    }
    
    // Check for spam patterns
    if (this.isSpamPattern(message)) {
      return 'SPAM'
    }
    
    // Check for abuse
    if (this.isAbusive(message)) {
      return 'ABUSE'
    }
    
    // Default to normal chat
    return 'NORMAL_CHAT'
  }

  isSpamPattern(message) {
    // Check for repeated characters
    if (/(\w)\1{10,}/.test(message)) return true
    // Check for all caps
    if (message.length > 10 && message === message.toUpperCase()) return true
    // Check for excessive punctuation
    if ((message.match(/[!]/g) || []).length > 5) return true
    return false
  }

  isAbusive(message) {
    const abusiveWords = ['hate', 'stupid', 'dumb', ' idiоt', 'fuck']
    return abusiveWords.some(word => message.toLowerCase().includes(word))
  }

  getConfidence(classification, message) {
    const weights = {
      'DIRECT_AI_REQUEST': 0.95,
      'CRITICAL_PROBLEM': 0.95,
      'ABUSE': 0.9,
      'SPAM': 0.85,
      'ERROR_REPORT': 0.8,
      'TECHNICAL_PROBLEM': 0.7,
      'TOOL_REQUEST': 0.7,
      'REQUIRES_ADMIN': 0.75,
      'QUESTION': 0.6,
      'REQUIRES_FOLLOW_UP': 0.6,
      'DUPLICATE': 0.7,
      'LOW_VALUE': 0.2,
      'NORMAL_CHAT': 0.3
    }
    return weights[classification] || 0.5
  }
}

module.exports = new AIClassifier()
