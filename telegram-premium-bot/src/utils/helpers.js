const validateUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  try { new URL(url); return true } catch { return false }
}

const sanitizeCommand = (cmd) => {
  if (!cmd || typeof cmd !== 'string') return ''
  return cmd.toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 32)
}

const escapeMarkdown = (text) => {
  if (!text) return ''
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
}

const paginate = (items, page = 1, perPage = 5) => {
  const start = (page - 1) * perPage
  return {
    items: items.slice(start, start + perPage),
    total: items.length,
    page,
    totalPages: Math.ceil(items.length / perPage),
    hasNext: start + perPage < items.length,
    hasPrev: page > 1,
  }
}

module.exports = { validateUrl, sanitizeCommand, escapeMarkdown, paginate }
