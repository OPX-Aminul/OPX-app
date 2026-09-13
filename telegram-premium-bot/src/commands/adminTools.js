const toolsService = require('../services/toolsService')
const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')

let addFlow = {}

const handleAdminTools = async (ctx) => {
  const tools = toolsService.getAll()
  let msg = '🛠 TOOL MANAGEMENT\n\n'
  
  if (tools.length === 0) {
    msg += 'No tools yet.'
  } else {
    msg += `Total: ${tools.length} tools\n\n`
    tools.slice(0, 10).forEach(t => {
      msg += `• ${t.name} (${t.command}) - ${t.status}\n`
    })
    if (tools.length > 10) msg += `\n...and ${tools.length - 10} more`
  }

  await ctx.reply(msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '➕ Add Tool', callback_data: 'admin_add_tool' }],
        [{ text: '✏️ Edit Tool', callback_data: 'admin_edit_tool' }],
        [{ text: '🗑 Delete Tool', callback_data: 'admin_delete_tool' }],
        [{ text: '📋 All Tools', callback_data: 'admin_tools_list' }],
        [{ text: '🏠 Back', callback_data: 'admin_menu' }]
      ]
    }
  })
}

const handleAddToolPrompt = async (ctx) => {
  addFlow[ctx.from.id] = { step: 'name' }
  await ctx.reply('➕ ADD NEW TOOL\n\nEnter tool name:', {
    reply_markup: { remove_keyboard: true }
  })
}

const handleAddToolName = async (ctx) => {
  const userFlow = addFlow[ctx.from.id]
  if (!userFlow || userFlow.step !== 'name') return
  
  userFlow.name = ctx.message.text
  userFlow.step = 'command'
  await ctx.reply(`Name: ${ctx.message.text}\n\nEnter command name (e.g., my_tool):`)
}

const handleAddToolCommand = async (ctx) => {
  const userFlow = addFlow[ctx.from.id]
  if (!userFlow || userFlow.step !== 'command') return
  
  userFlow.command = ctx.message.text
  userFlow.step = 'category'
  await ctx.reply(`Command: ${ctx.message.text}\n\nEnter category (e.g., Cybersecurity):`)
}

const handleAddToolCategory = async (ctx) => {
  const userFlow = addFlow[ctx.from.id]
  if (!userFlow || userFlow.step !== 'category') return
  
  userFlow.category = ctx.message.text
  userFlow.step = 'description'
  await ctx.reply(`Category: ${ctx.message.text}\n\nEnter short description:`)
}

const handleAddToolDescription = async (ctx) => {
  const userFlow = addFlow[ctx.from.id]
  if (!userFlow || userFlow.step !== 'description') return
  
  userFlow.shortDescription = ctx.message.text
  userFlow.step = 'github'
  await ctx.reply(`Description: ${ctx.message.text}\n\nEnter GitHub URL (or skip with "none"):`)
}

const handleAddToolGitHub = async (ctx) => {
  const userFlow = addFlow[ctx.from.id]
  if (!userFlow) return
  
  userFlow.github = ctx.message.text.toLowerCase() === 'none' ? null : ctx.message.text
  userFlow.step = 'download'
  await ctx.reply(`GitHub: ${userFlow.github || 'none'}\n\nEnter download URL (or skip with "none"):`)
}

const handleAddToolDownload = async (ctx) => {
  const userFlow = addFlow[ctx.from.id]
  if (!userFlow) return
  
  userFlow.download = ctx.message.text.toLowerCase() === 'none' ? null : ctx.message.text
  userFlow.step = 'complete'
  
  try {
    const tool = await toolsService.add(userFlow)
    await ctx.reply(`✅ Tool added successfully!\n\nName: ${tool.name}\nCommand: /${tool.command}`, {
      reply_markup: { inline_keyboard: [[{ text: '🏠 Back', callback_data: 'admin_menu' }]] }
    })
  } catch (err) {
    await ctx.reply(`❌ Error: ${err.message}`)
  }
  
  delete addFlow[ctx.from.id]
}

module.exports = {
  handleAdminTools,
  handleAddToolPrompt,
  handleAddToolName,
  handleAddToolCommand,
  handleAddToolCategory,
  handleAddToolDescription,
  handleAddToolGitHub,
  handleAddToolDownload,
  addFlow
}
