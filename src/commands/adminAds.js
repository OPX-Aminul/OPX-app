const adsService = require('../services/adsService')
const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')

let adFlow = {}

const handleAdminAds = async (ctx) => {
  const ads = adsService.getActiveAds()
  let msg = '📢 AD MANAGEMENT\n\n'
  
  if (ads.length === 0) {
    msg += 'No ads configured.'
  } else {
    msg += `Active Ads: ${ads.length}\n\n`
    ads.slice(0, 5).forEach(ad => {
      msg += `• ${ad.name} (${ad.displayType})\n`
    })
  }

  await ctx.reply(msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '➕ Add Ad', callback_data: 'admin_add_ad' }],
        [{ text: '🗑 Delete Ad', callback_data: 'admin_delete_ad' }],
        [{ text: '🏠 Back', callback_data: 'admin_menu' }]
      ]
    }
  })
}

const handleAddAdPrompt = async (ctx) => {
  adFlow[ctx.from.id] = { step: 'name' }
  await ctx.reply('➕ ADD NEW AD\n\nEnter ad name:', {
    reply_markup: { remove_keyboard: true }
  })
}

const handleAddAdName = async (ctx) => {
  const userFlow = adFlow[ctx.from.id]
  if (!userFlow || userFlow.step !== 'name') return
  
  userFlow.name = ctx.message.text
  userFlow.step = 'provider'
  await ctx.reply(`Name: ${ctx.message.text}\n\nEnter provider (e.g., telegram_ads):`)
}

const handleAddAdProvider = async (ctx) => {
  const userFlow = adFlow[ctx.from.id]
  if (!userFlow || userFlow.step !== 'provider') return
  
  userFlow.provider = ctx.message.text
  userFlow.step = 'targetUrl'
  await ctx.reply(`Provider: ${ctx.message.text}\n\nEnter target URL:`)
}

const handleAddAdTarget = async (ctx) => {
  const userFlow = adFlow[ctx.from.id]
  if (!userFlow || userFlow.step !== 'targetUrl') return
  
  userFlow.targetUrl = ctx.message.text
  userFlow.step = 'complete'
  
  try {
    const ad = await adsService.addAd(userFlow)
    await ctx.reply(`✅ Ad added successfully!\n\nName: ${ad.name}`, {
      reply_markup: { inline_keyboard: [[{ text: '🏠 Back', callback_data: 'admin_menu' }]] }
    })
  } catch (err) {
    await ctx.reply(`❌ Error: ${err.message}`)
  }
  
  delete adFlow[ctx.from.id]
}

module.exports = {
  handleAdminAds,
  handleAddAdPrompt,
  handleAddAdName,
  handleAddAdProvider,
  handleAddAdTarget,
  adFlow
}
