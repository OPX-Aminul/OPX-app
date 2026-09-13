const path = require('path')
const fs = require('fs').promises
const logger = require('../utils/logger')

const CHANNELS_FILE = path.join(__dirname, '../../data/channels.json')
const POSTS_FILE = path.join(__dirname, '../../data/scheduled_posts.json')

class ChannelsService {
  constructor() {
    this.channels = []
    this.scheduledPosts = []
  }

  async load() {
    try {
      const raw = await fs.readFile(CHANNELS_FILE, 'utf8')
      this.channels = JSON.parse(raw)
    } catch {
      this.channels = []
      await this.saveChannels()
    }
    try {
      const raw = await fs.readFile(POSTS_FILE, 'utf8')
      this.scheduledPosts = JSON.parse(raw)
    } catch {
      this.scheduledPosts = []
      await this.savePosts()
    }
  }

  async saveChannels() {
    await fs.writeFile(CHANNELS_FILE, JSON.stringify(this.channels, null, 2), 'utf8')
  }

  async savePosts() {
    await fs.writeFile(POSTS_FILE, JSON.stringify(this.scheduledPosts, null, 2), 'utf8')
  }

  async addChannel(channelData) {
    const channel = {
      id: channelData.id || `ch_${Date.now()}`,
      channelId: channelData.channelId,
      username: channelData.username,
      botPermission: channelData.botPermission || 'limited',
      aiMode: channelData.aiMode || 'draft_only',
      autoPost: channelData.autoPost !== undefined ? channelData.autoPost : false,
      status: channelData.status || 'active',
      createdAt: new Date().toISOString()
    }
    this.channels.push(channel)
    await this.saveChannels()
    return channel
  }

  async update(id, updates) {
    const index = this.channels.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Channel not found.')
    this.channels[index] = { ...this.channels[index], ...updates }
    await this.saveChannels()
    return this.channels[index]
  }

  async remove(id) {
    const index = this.channels.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Channel not found.')
    const removed = this.channels.splice(index, 1)[0]
    await this.saveChannels()
    return removed
  }

  getActiveChannels() {
    return this.channels.filter(c => c.status === 'active')
  }

  async addScheduledPost(postData) {
    const post = {
      id: postData.id || `post_${Date.now()}`,
      channelId: postData.channelId,
      content: postData.content,
      scheduledFor: postData.scheduledFor,
      status: postData.status || 'pending',
      template: postData.template || null,
      createdAt: new Date().toISOString()
    }
    this.scheduledPosts.push(post)
    await this.savePosts()
    return post
  }

  async updatePostStatus(id, status) {
    const index = this.scheduledPosts.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Post not found.')
    this.scheduledPosts[index].status = status
    this.scheduledPosts[index].updatedAt = new Date().toISOString()
    await this.savePosts()
    return this.scheduledPosts[index]
  }

  getPendingPosts() {
    return this.scheduledPosts.filter(p => p.status === 'pending')
  }
}

module.exports = new ChannelsService()
