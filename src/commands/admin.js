const toolsService = require('../services/toolsService')
const websitesService = require('../services/websitesService')
const welcomeService = require('../services/welcomeService')
const profileService = require('../services/profileService')
const { createAdminMenu } = require('../keyboards/buttons')
const logger = require('../utils/logger')

const handleAdmin = async (ctx) => {
  const toolCount = toolsService.getAll().length
  const websiteCount = websitesService.getAll().length
  const welcomeEnabled = welcomeService.get().welcomeEnabled
    ? 'Enabled'
    : 'Disabled'
  const deleteAfter = welcomeService.get().welcomeDeleteAfter

  let msg = '╭──────────────────────╮\n'
  msg += '       ⚙️ ADMIN PANEL\n'
  msg += '╰──────────────────────╯\n\n'
  msg += `📊 Statistics:\n`
  msg += `• Tools: ${toolCount}\n`
  msg += `• Websites: ${websiteCount}\n`
  msg += `• Welcome: ${welcomeEnabled} (${deleteAfter}s auto-delete)\n\n`
  msg += 'Choose an option below 👇'

  await ctx.reply(msg, { reply_markup: createAdminMenu() })
  logger.info(`Owner ${ctx.from?.id} opened admin panel`)
}

module.exports = handleAdmin
