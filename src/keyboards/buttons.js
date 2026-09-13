const { InlineKeyboard } = require('telegraf')

const createMainMenu = () => {
  const kb = new InlineKeyboard()
  kb.row('🛠 Tools', '👤 Profile').row('🌐 Websites', '🔎 Search')
  kb.row('⚙️ Admin', '📚 Help').row('🏠 Home')
  return kb
}

const createToolsMenu = (tools, page = 1) => {
  const kb = new InlineKeyboard()
  const perPage = 5
  const start = (page - 1) * perPage
  const end = start + perPage
  const pageTools = tools.slice(start, end)

  for (const tool of pageTools) {
    kb.text(tool.name, `tool_${tool.id}`).row()
  }

  if (page > 1) kb.text('⬅️ Previous', `tools_page_${page - 1}`).row()
  if (page < Math.ceil(tools.length / perPage)) kb.text('Next ➡️', `tools_page_${page + 1}`).row()
  kb.text('🏠 Back', 'main_menu')
  return kb
}

const createToolDetailButtons = (tool) => {
  const kb = new InlineKeyboard()
  if (tool.github) kb.url('🌐 GitHub', tool.github).row()
  if (tool.download) kb.url('📥 Download', tool.download).row()
  if (tool.documentation) kb.url('📚 Documentation', tool.documentation).row()
  if (tool.website) kb.url('🔗 Website', tool.website).row()
  kb.text('⬅️ Back', `tool_list`)
  return kb
}

const createAdminMenu = () => {
  const kb = new InlineKeyboard()
  kb.row('🛠 Manage Tools', '👤 Edit Profile')
  kb.row('🌐 Manage Websites', '👋 Welcome Config')
  kb.row('📊 Statistics', '⚙️ Settings')
  kb.text('🏠 Back', 'main_menu')
  return kb
}

const createWelcomeConfigMenu = () => {
  const kb = new InlineKeyboard()
  kb.row('✏️ Edit Message', '✅ Enable/Disable')
  kb.row('⏱️ Set Delete Timer', '📋 View Current')
  kb.text('🏠 Back', 'admin_menu')
  return kb
}

const createConfirmButtons = (callbackYes, callbackNo = 'cancel') => {
  const kb = new InlineKeyboard()
  kb.text('✅ Confirm', callbackYes).row()
  kb.text('❌ Cancel', callbackNo)
  return kb
}

module.exports = {
  createMainMenu,
  createToolsMenu,
  createToolDetailButtons,
  createAdminMenu,
  createWelcomeConfigMenu,
  createConfirmButtons,
}
