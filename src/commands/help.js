const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')

const helpText = `📚 HELP & COMMANDS

🛠 Tools:
  /tools - View all tools
  /search <keyword> - Search for tools

👤 Profile:
  /profile - View developer profile
  /about - View about section

🌐 Websites:
  /websites - View websites & projects

👋 Welcome:
  /rules - View group rules

⚙️ Admin (Owner only):
  /admin - Open admin panel
  /addtool - Add a new tool
  /edittool - Edit existing tool
  /deletetool - Delete a tool
  /listtools - List all tools
  /addwebsite - Add a website
  /editwebsite - Edit a website
  /deletewebsite - Delete a website
  /setrules - Set group rules
  /settings - Bot settings

📊 Statistics available in admin panel.

For support, contact the owner.`

const handleHelp = async (ctx) => {
  await ctx.editMessageText(helpText).catch(() => {
    ctx.reply(helpText)
  })
  logger.info(`User ${ctx.from?.id} viewed help`)
}

module.exports = handleHelp
