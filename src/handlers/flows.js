const websitesService = require('../services/websitesService')
const welcomeService = require('../services/welcomeService')
const profileService = require('../services/profileService')
const { isOwner } = require('../middleware/auth')

const websiteFlow = {}
const welcomeFlow = {}
const profileFlow = {}

const handleFlows = async (ctx) => {
  if (!ctx.from || !ctx.message?.text || !isOwner(ctx)) return false
  const userId = ctx.from.id
  const text = ctx.message.text.trim()

  if (websiteFlow[userId]) {
    const flow = websiteFlow[userId]
    if (flow.step === 'name') {
      flow.name = text
      flow.step = 'url'
      await ctx.reply('Enter website URL (https://...):')
      return true
    }
    if (flow.step === 'url') {
      flow.url = text
      flow.step = 'description'
      await ctx.reply('Enter a short description (or "none"):')
      return true
    }
    if (flow.step === 'description') {
      try {
        const site = await websitesService.add({
          name: flow.name,
          url: flow.url,
          description: text.toLowerCase() === 'none' ? '' : text
        })
        await ctx.reply(`Website added: ${site.name}\n${site.url}`, {
          reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'admin_websites' }]] }
        })
      } catch (err) {
        await ctx.reply(`Error: ${err.message}`)
      }
      delete websiteFlow[userId]
      return true
    }
  }

  if (welcomeFlow[userId]) {
    const flow = welcomeFlow[userId]
    if (flow.step === 'message') {
      await welcomeService.setMessage(text)
      delete welcomeFlow[userId]
      await ctx.reply('Welcome message updated.', {
        reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'admin_welcome' }]] }
      })
      return true
    }
    if (flow.step === 'timer') {
      await welcomeService.setDeleteAfter(text)
      delete welcomeFlow[userId]
      await ctx.reply('Delete timer updated.', {
        reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'admin_welcome' }]] }
      })
      return true
    }
  }

  if (profileFlow[userId]) {
    const field = profileFlow[userId].field
    const allowed = ['name', 'bio', 'location', 'email']
    if (allowed.includes(field)) {
      await profileService.update({ [field]: text })
      delete profileFlow[userId]
      await ctx.reply(`Profile ${field} updated.`, {
        reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'admin_profile' }]] }
      })
      return true
    }
    delete profileFlow[userId]
  }

  return false
}

module.exports = { handleFlows, websiteFlow, welcomeFlow, profileFlow }
