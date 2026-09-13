# OPX Telegram Bot - Deployment Guide

## Quick Start (Local)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add:
#   BOT_TOKEN=your_telegram_bot_token
#   OWNER_ID=your_telegram_user_id
#   SECRET_KEY=your_random_secret_key

# 3. Start the bot
npm start
```

## Render Deployment

### Step 1: Create New Web Service on Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository

### Step 2: Configure Render Service

| Setting | Value |
|---------|-------|
| **Name** | `opx-telegram-bot` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Starter (free) or Standard |

### Step 3: Add Environment Variables

In Render dashboard, go to "Environment" and add:

| Key | Value |
|-----|-------|
| `BOT_TOKEN` | Your Telegram Bot Token from @BotFather |
| `OWNER_ID` | Your Telegram User ID |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `SECRET_KEY` | Generate a random string (e.g., use `openssl rand -hex 32`) |

### Step 4: Deploy

Click "Create Web Service". Wait for deployment to complete.

### Step 5: Access Admin Panel

After deployment, your Admin Panel will be available at:
```
https://opx-telegram-bot.onrender.com
```

## Post-Deployment Configuration

1. Open the Admin Panel URL
2. Navigate to "AI Providers" and add your OpenAI API key
3. Test the connection
4. Configure Smart Group AI settings
5. Add tools via "Tools" section

## Features Included

- ✅ Telegram Bot with all commands
- ✅ Smart AI Management System
- ✅ Tool Directory & Management
- ✅ AI Provider Management (Multi-provider support)
- ✅ Knowledge Base
- ✅ Incident Management
- ✅ Warning System
- ✅ GitHub Integration
- ✅ Admin Panel (Web UI)
- ✅ REST API
- ✅ Audit Logging
- ✅ Configuration Center

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot |
| `/help` | Show help |
| `/tools` | List all tools |
| `/search <keyword>` | Search for tools |
| `/profile` | View developer profile |
| `/websites` | List websites |
| `/rules` | View group rules |
| `/ai <question>` | Ask AI assistant |
| `/admin` | Admin panel (owner only) |
| `/smart` | Smart management dashboard |
| `/config` | Configuration center |
| `/warnings` | Manage warnings |
| `/knowledge` | Knowledge base |

## Admin Panel Features

- Dashboard with statistics
- Tools management (CRUD)
- AI Providers management
- GitHub repositories
- Configuration center
- Audit logs
- Feature flags

## Troubleshooting

### Bot not responding
- Check if BOT_TOKEN is correct in Render environment variables
- Restart the service

### Admin Panel not loading
- Ensure PORT is set to 10000
- Check logs in Render dashboard

### AI not working
- Add AI provider in Admin Panel → AI Providers
- Test connection before saving

## Security Notes

- Never commit `.env` file to GitHub
- Use strong SECRET_KEY (minimum 32 characters)
- Rotate API keys periodically
- Enable audit logging in production

## Support

For issues, check the Render logs or contact the owner.
