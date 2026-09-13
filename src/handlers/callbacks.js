const handleStart = require('../commands/start')
const handleHelp = require('../commands/help')
const { handleToolsList } = require('../commands/tools')
const handleToolDetail = require('../commands/toolDetail')
const handleProfile = require('../commands/profile')
const { handleWebsites } = require('../commands/websites')
const { handleSearchPrompt } = require('../commands/search')
const handleAdmin = require('../commands/admin')
const { handleWelcomeConfig } = require('../commands/welcome')
const handleSettings = require('../commands/settings')
const handleStats = require('../commands/stats')
const { handleAdminTools, handleAddToolPrompt } = require('../commands/adminTools')
const { handleAdminAds, handleAddAdPrompt } = require('../commands/adminAds')
const { handleSmartDashboard } = require('../commands/smartDashboard')
const { handleWarningsList } = require('../commands/smartWarnings')
const { handleKnowledgeBase, handleAddSolutionPrompt } = require('../commands/smartKnowledge')
const {
  handleAdminConfig,
  handleAIProvidersList,
  handleAddProviderPrompt,
  handleTestProvider,
  handleRefreshModels
} = require('../commands/adminConfig')
const toolsService = require('../services/toolsService')
const websitesService = require('../services/websitesService')
const welcomeService = require('../services/welcomeService')
const profileService = require('../services/profileService')
const incidentManager = require('../services/smart/incidentManager')
const configService = require('../services/config/configService')
const { isAdmin, isOwner } = require('../middleware/auth')
const logger = require('../utils/logger')

const requireOwner = async (ctx) => {
  if (!isOwner(ctx)) {
    await ctx.reply('Unauthorized.')
    return false
  }
  return true
}

const handleCallbacks = async (ctx) => {
  const data = ctx.callbackQuery?.data
  if (!data) return

  logger.info(`Callback: ${data} from user ${ctx.from?.id}`)
  await ctx.answerCbQuery().catch(() => {})

  try {
    if (data === 'main_menu') return handleStart(ctx)
    if (data.startsWith('tools_page_')) return handleToolsList(ctx)
    if (data.startsWith('websites_page_')) return handleWebsites(ctx)
    if (data.startsWith('tool_list_') || data === 'tools_back') {
      ctx.callbackQuery.data = 'tools_page_1'
      return handleToolsList(ctx)
    }
    if (data.startsWith('tool_')) return handleToolDetail(ctx)
    if (data === 'profile_view') return handleProfile(ctx)
    if (data === 'search_prompt') return handleSearchPrompt(ctx)
    if (data === 'help') return handleHelp(ctx)

    if (data === 'admin_menu') {
      if (!isAdmin(ctx)) return ctx.reply('Unauthorized.')
      return handleAdmin(ctx)
    }

    if (!isOwner(ctx) && data.startsWith('admin_')) return ctx.reply('Unauthorized.')
    if (!isOwner(ctx) && (data.startsWith('smart_') || data.startsWith('config_') || data.startsWith('welcome_') || data.startsWith('warning_') || data.startsWith('test_provider_') || data.startsWith('refresh_models_'))) {
      return ctx.reply('Unauthorized.')
    }

    if (data === 'smart_dashboard') return handleSmartDashboard(ctx)
    if (data === 'smart_incidents') {
      const incidents = incidentManager.getOpenIncidents()
      let msg = 'OPEN INCIDENTS\n\n'
      if (!incidents.length) msg += 'No open incidents.'
      else incidents.slice(0, 10).forEach(i => { msg += `• [${i.severity}] ${i.id} (${i.status})\n` })
      return ctx.reply(msg, { reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'smart_dashboard' }]] } })
    }
    if (data === 'smart_warnings') return handleWarningsList(ctx)
    if (data === 'smart_knowledge') return handleKnowledgeBase(ctx)
    if (data === 'kb_add_solution' || data === 'kb_add_faq') return handleAddSolutionPrompt(ctx)
    if (data === 'kb_search') {
      return ctx.reply('Send a keyword to search the knowledge base, or open the Mini App for full search.', {
        reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'smart_knowledge' }]] }
      })
    }
    if (data === 'admin_config') return handleAdminConfig(ctx)
    if (data === 'config_ai_providers') return handleAIProvidersList(ctx)
    if (data === 'config_add_provider') return handleAddProviderPrompt(ctx)
    if (data === 'config_github') {
      const conns = configService.config?.github?.connections || []
      let msg = 'GITHUB CONNECTIONS\n\n'
      if (!conns.length) msg += 'No GitHub connections yet.\nUse the Mini App or /config to add one.'
      else conns.forEach(c => { msg += `• ${c.owner} (${c.enabled ? 'enabled' : 'disabled'})\n` })
      return ctx.reply(msg, { reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'admin_config' }]] } })
    }
    if (data === 'config_ads') return handleAdminAds(ctx)
    if (data === 'config_group_ai') {
      const g = configService.config?.groupAI || {}
      let msg = 'SMART GROUP AI\n\n'
      msg += `Enabled: ${g.enabled ? 'Yes' : 'No'}\n`
      msg += `Threshold: ${g.responseThreshold}\n`
      msg += `Mention required: ${g.mentionRequired ? 'Yes' : 'No'}\n`
      return ctx.reply(msg, { reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'admin_config' }]] } })
    }
    if (data === 'config_moderation') {
      const m = configService.config?.moderation || {}
      let msg = 'MODERATION\n\n'
      msg += `Spam threshold: ${m.spamThreshold}\n`
      msg += `Warning count: ${m.warningCount}\n`
      msg += `Auto moderation: ${m.autoModeration ? 'Yes' : 'No'}\n`
      return ctx.reply(msg, { reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'admin_config' }]] } })
    }
    if (data === 'config_features') {
      const flags = configService.config?.featureFlags || {}
      let msg = 'FEATURE FLAGS\n\n'
      Object.entries(flags).forEach(([k, v]) => { msg += `• ${k}: ${v ? 'ON' : 'OFF'}\n` })
      return ctx.reply(msg, { reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'admin_config' }]] } })
    }
    if (data === 'config_audit') {
      const logs = configService.getAuditLog(20)
      let msg = 'AUDIT LOG\n\n'
      if (!logs.length) msg += 'No audit entries yet.'
      else logs.forEach(l => { msg += `• ${l.action} ${l.key || ''}\n` })
      return ctx.reply(msg, { reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'admin_config' }]] } })
    }
    if (data === 'admin_settings') return handleSettings(ctx)
    if (data === 'admin_stats') return handleStats(ctx)
    if (data === 'admin_welcome') return handleWelcomeConfig(ctx)
    if (data === 'admin_tools') return handleAdminTools(ctx)
    if (data === 'admin_add_tool') return handleAddToolPrompt(ctx)
    if (data === 'admin_ads') return handleAdminAds(ctx)
    if (data === 'admin_add_ad') return handleAddAdPrompt(ctx)

    if (data === 'admin_tools_list') {
      const tools = toolsService.getAll()
      let msg = 'ALL TOOLS\n\n'
      if (!tools.length) msg += 'No tools yet.'
      else tools.forEach(t => { msg += `• ${t.name} (/${t.command}) - ${t.status || 'active'}\n` })
      return ctx.reply(msg, { reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'admin_tools' }]] } })
    }

    if (data === 'admin_edit_tool' || data === 'admin_delete_tool') {
      const tools = toolsService.getAll()
      if (!tools.length) return ctx.reply('No tools to manage.', { reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'admin_tools' }]] } })
      const prefix = data === 'admin_delete_tool' ? 'deltool_' : 'edittool_'
      return ctx.reply(data === 'admin_delete_tool' ? 'Select a tool to delete:' : 'Select a tool to view/edit:', {
        reply_markup: {
          inline_keyboard: [
            ...tools.slice(0, 20).map(t => [{ text: t.name, callback_data: `${prefix}${t.id}` }]),
            [{ text: 'Back', callback_data: 'admin_tools' }]
          ]
        }
      })
    }

    if (data.startsWith('deltool_')) {
      if (!(await requireOwner(ctx))) return
      const id = data.replace('deltool_', '')
      try {
        const removed = await toolsService.remove(id)
        return ctx.reply(`Deleted: ${removed.name}`, { reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'admin_tools' }]] } })
      } catch (err) {
        return ctx.reply(`Error: ${err.message}`)
      }
    }

    if (data.startsWith('edittool_')) {
      const id = data.replace('edittool_', '')
      const tool = toolsService.getById(id)
      if (!tool) return ctx.reply('Tool not found.')
      let msg = `TOOL: ${tool.name}\nCommand: /${tool.command}\nCategory: ${tool.category || '-'}\nStatus: ${tool.status || 'active'}\n`
      if (tool.shortDescription) msg += `\n${tool.shortDescription}`
      return ctx.reply(msg, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Delete', callback_data: `deltool_${id}` }],
            [{ text: 'Back', callback_data: 'admin_tools' }]
          ]
        }
      })
    }

    if (data === 'admin_websites') {
      const sites = websitesService.getAll()
      let msg = 'WEBSITES\n\n'
      if (!sites.length) msg += 'No websites yet.'
      else sites.forEach(s => { msg += `• ${s.name}\n  ${s.url}\n` })
      return ctx.reply(msg, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Add Website', callback_data: 'admin_add_website' }],
            [{ text: 'Delete Website', callback_data: 'admin_delete_website' }],
            [{ text: 'Back', callback_data: 'admin_menu' }]
          ]
        }
      })
    }

    if (data === 'admin_add_website') {
      ctx.sessionFlows = ctx.sessionFlows
      const flows = require('./flows')
      flows.websiteFlow[ctx.from.id] = { step: 'name' }
      return ctx.reply('ADD WEBSITE\n\nEnter website name:')
    }

    if (data === 'admin_delete_website') {
      const sites = websitesService.getAll()
      if (!sites.length) return ctx.reply('No websites to delete.', { reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'admin_websites' }]] } })
      return ctx.reply('Select a website to delete:', {
        reply_markup: {
          inline_keyboard: [
            ...sites.slice(0, 20).map(s => [{ text: s.name, callback_data: `delsite_${s.id}` }]),
            [{ text: 'Back', callback_data: 'admin_websites' }]
          ]
        }
      })
    }

    if (data.startsWith('delsite_')) {
      try {
        const removed = await websitesService.remove(data.replace('delsite_', ''))
        return ctx.reply(`Deleted: ${removed.name}`, { reply_markup: { inline_keyboard: [[{ text: 'Back', callback_data: 'admin_websites' }]] } })
      } catch (err) {
        return ctx.reply(`Error: ${err.message}`)
      }
    }

    if (data === 'admin_profile') {
      const profile = profileService.get()
      let msg = 'EDIT PROFILE\n\n'
      msg += `Name: ${profile.name || '-'}\n`
      msg += `Bio: ${profile.bio || '-'}\n`
      msg += `Location: ${profile.location || '-'}\n`
      msg += `Email: ${profile.email || '-'}\n`
      return ctx.reply(msg, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Edit Name', callback_data: 'profile_edit_name' }, { text: 'Edit Bio', callback_data: 'profile_edit_bio' }],
            [{ text: 'Edit Location', callback_data: 'profile_edit_location' }, { text: 'Edit Email', callback_data: 'profile_edit_email' }],
            [{ text: 'Back', callback_data: 'admin_menu' }]
          ]
        }
      })
    }

    if (data.startsWith('profile_edit_')) {
      const field = data.replace('profile_edit_', '')
      const flows = require('./flows')
      flows.profileFlow[ctx.from.id] = { field }
      return ctx.reply(`Send the new ${field}:`)
    }

    if (data === 'welcome_toggle') {
      const cfg = welcomeService.get()
      if (cfg.welcomeEnabled) await welcomeService.disable()
      else await welcomeService.enable()
      return handleWelcomeConfig(ctx)
    }

    if (data === 'welcome_edit_msg') {
      const flows = require('./flows')
      flows.welcomeFlow[ctx.from.id] = { step: 'message' }
      return ctx.reply('Send the new welcome message. You can use {firstName} and {groupName}.')
    }

    if (data === 'welcome_set_timer') {
      const flows = require('./flows')
      flows.welcomeFlow[ctx.from.id] = { step: 'timer' }
      return ctx.reply('Send delete timer in seconds (5-300):')
    }

    if (data.startsWith('test_provider_')) return handleTestProvider(ctx)
    if (data.startsWith('refresh_models_')) return handleRefreshModels(ctx)
    if (data.startsWith('warning_')) return require('../commands/smartWarnings').handleWarningAction(ctx)
  } catch (err) {
    logger.error('Callback handler error:', err)
    await ctx.reply('Something went wrong. Please try again.').catch(() => {})
  }
}

module.exports = handleCallbacks
