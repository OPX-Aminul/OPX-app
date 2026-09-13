const knowledgeBase = require('../services/smart/knowledgeBase')
const { escapeMarkdown } = require('../utils/helpers')
const logger = require('../utils/logger')

let kbFlow = {}

const handleKnowledgeBase = async (ctx) => {
  const solutions = knowledgeBase.solutions
  const faqs = knowledgeBase.faqs
  
  let msg = '📚 KNOWLEDGE BASE\n\n'
  msg += `Solutions: ${solutions.length}\n`
  msg += `FAQs: ${faqs.length}\n\n`
  msg += 'Manage your knowledge base here.'
  
  await ctx.reply(msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '➕ Add Solution', callback_data: 'kb_add_solution' }],
        [{ text: '➕ Add FAQ', callback_data: 'kb_add_faq' }],
        [{ text: '🔍 Search', callback_data: 'kb_search' }],
        [{ text: '🏠 Back', callback_data: 'smart_dashboard' }]
      ]
    }
  })
  
  logger.info(`Owner ${ctx.from?.id} viewed knowledge base`)
}

const handleAddSolutionPrompt = async (ctx) => {
  kbFlow[ctx.from.id] = { step: 'question' }
  await ctx.reply('➕ ADD SOLUTION\n\nEnter the question:', {
    reply_markup: { remove_keyboard: true }
  })
}

const handleAddSolutionQuestion = async (ctx) => {
  const userFlow = kbFlow[ctx.from.id]
  if (!userFlow || userFlow.step !== 'question') return
  
  userFlow.question = ctx.message.text
  userFlow.step = 'answer'
  await ctx.reply(`Question: ${ctx.message.text}\n\nEnter the answer:`)
}

const handleAddSolutionAnswer = async (ctx) => {
  const userFlow = kbFlow[ctx.from.id]
  if (!userFlow || userFlow.step !== 'answer') return
  
  try {
    const solution = await knowledgeBase.addSolution({
      question: userFlow.question,
      answer: ctx.message.text
    })
    await ctx.reply(`✅ Solution added!\n\nID: ${solution.id}`, {
      reply_markup: { inline_keyboard: [[{ text: '🏠 Back', callback_data: 'smart_dashboard' }]] }
    })
  } catch (err) {
    await ctx.reply(`❌ Error: ${err.message}`)
  }
  
  delete kbFlow[ctx.from.id]
}

module.exports = {
  handleKnowledgeBase,
  handleAddSolutionPrompt,
  handleAddSolutionQuestion,
  handleAddSolutionAnswer,
  kbFlow
}
