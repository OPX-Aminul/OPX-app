const configService = require('../services/config/configService')
const aiService = require('../services/aiService')
const logger = require('../utils/logger')

let configFlow = {}

const handleAdminConfig = async (ctx) => {
  const config = configService.config
  
  let msg = '⚙️ ADMIN CONFIGURATION\n\n'
  msg += 'Manage all runtime settings here.\n\n'
  
  // Summary
  msg += `🤖 AI Providers: ${config.aiProviders.length}\n`
  msg += `🔗 GitHub Connections: ${config.github.connections.length}\n`
  msg += `📢 Ads Systems: ${Object.keys(config.ads).length}\n`
  msg += `🛡 Smart Group AI: ${config.groupAI.enabled ? 'Enabled' : 'Disabled'}\n`
  msg += `📝 Moderation: ${config.moderation.autoModeration ? 'Auto' : 'Manual'}\n`
  
  await ctx.reply(msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🤖 AI Providers', callback_data: 'config_ai_providers' }],
        [{ text: '🔗 GitHub', callback_data: 'config_github' }],
        [{ text: '📢 Ads', callback_data: 'config_ads' }],
        [{ text: '🛡 Smart Group AI', callback_data: 'config_group_ai' }],
        [{ text: '📝 Moderation', callback_data: 'config_moderation' }],
        [{ text: '🚩 Feature Flags', callback_data: 'config_features' }],
        [{ text: '📊 Audit Log', callback_data: 'config_audit' }],
        [{ text: '🏠 Back', callback_data: 'admin_menu' }]
      ]
    }
  })
}

const handleAIProvidersList = async (ctx) => {
  const providers = configService.config.aiProviders
  let msg = '🤖 AI PROVIDERS\n\n'
  
  if (providers.length === 0) {
    msg += 'No providers configured.'
  } else {
    providers.forEach(p => {
      msg += `• ${p.name} (${p.health}) - Model: ${p.models?.[0]?.id || 'N/A'}\n`
    })
  }
  
  await ctx.reply(msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '➕ Add Provider', callback_data: 'config_add_provider' }],
        [{ text: '🏠 Back', callback_data: 'admin_config' }]
      ]
    }
  })
}

const handleAddProviderPrompt = async (ctx) => {
  configFlow[ctx.from.id] = { step: 'provider_name' }
  await ctx.reply('➕ ADD AI PROVIDER\n\nEnter provider name:', {
    reply_markup: { remove_keyboard: true }
  })
}

const handleAddProviderName = async (ctx) => {
  const flow = configFlow[ctx.from.id]
  if (!flow || flow.step !== 'provider_name') return
  
  flow.name = ctx.message.text
  flow.step = 'base_url'
  await ctx.reply(`Name: ${ctx.message.text}\n\nEnter Base URL (e.g., https://api.openai.com/v1):`)
}

const handleAddProviderUrl = async (ctx) => {
  const flow = configFlow[ctx.from.id]
  if (!flow || flow.step !== 'base_url') return
  
  flow.baseUrl = ctx.message.text
  flow.step = 'api_key'
  await ctx.reply(`URL: ${ctx.message.text}\n\nEnter API Key:`)
}

const handleAddProviderKey = async (ctx) => {
  const flow = configFlow[ctx.from.id]
  if (!flow || flow.step !== 'api_key') return
  
  flow.apiKey = ctx.message.text
  flow.step = 'complete'
  
  try {
    const provider = await configService.addAIProvider(flow, ctx.from.id)
    await ctx.reply(`✅ Provider added!\n\nName: ${provider.name}\nHealth: ${provider.health}`, {
      reply_markup: { inline_keyboard: [[{ text: '🏠 Back', callback_data: 'admin_config' }]] }
    })
  } catch (err) {
    await ctx.reply(`❌ Error: ${err.message}`)
  }
  
  delete configFlow[ctx.from.id]
}

const handleTestProvider = async (ctx) => {
  const data = ctx.callbackQuery.data
  const providerId = data.replace('test_provider_', '')
  
  try {
    const result = await configService.testProvider(providerId)
    if (result.success) {
      await ctx.reply(`✅ Connection successful! Response time: ${result.responseTime}ms`)
    } else {
      await ctx.reply(`❌ Connection failed: ${result.error || result.status}`)
    }
  } catch (err) {
    await ctx.reply(`❌ Error: ${err.message}`)
  }
}

const handleRefreshModels = async (ctx) => {
  const data = ctx.callbackQuery.data
  const providerId = data.replace('refresh_models_', '')
  
  try {
    const models = await configService.refreshModels(providerId)
    await ctx.reply(`✅ Found ${models.length} models:\n\n${models.slice(0, 10).map(m => `• ${m.id}`).join('\n')}`)
  } catch (err) {
    await ctx.reply(`❌ Error: ${err.message}`)
  }
}

module.exports = {
  handleAdminConfig,
  handleAIProvidersList,
  handleAddProviderPrompt,
  handleAddProviderName,
  handleAddProviderUrl,
  handleAddProviderKey,
  handleTestProvider,
  handleRefreshModels,
  configFlow
}
