# Meta Ads MCP Server

MCP (Model Context Protocol) server that connects Claude to the Facebook/Meta Marketing API. Allows Claude to query ad accounts, campaigns, ad sets, ads, performance insights, and manage campaigns directly.

## Prerequisites

- Node.js 18+
- A Facebook/Meta access token with `ads_read` and `ads_management` permissions

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your `.env` file (optional, for local testing):

```bash
cp .env.example .env
# Edit .env and add your META_ACCESS_TOKEN
```

## Getting a Facebook Access Token

### For Testing (Short-Lived Token)

1. Go to the [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Click "Generate Access Token"
4. Add permissions: `ads_read`, `ads_management`
5. Copy the token (expires in ~1 hour)

### For Production (System User Token)

1. Go to [Business Manager](https://business.facebook.com/) > Business Settings
2. Navigate to Users > System Users
3. Create a System User (Admin role)
4. Click "Generate New Token"
5. Select your app and add permissions: `ads_read`, `ads_management`
6. Copy the token (does not expire)

## Configure with Claude

### Option 1: Local (Claude Desktop / Claude Code)

Add to your Claude Desktop config (`claude_desktop_config.json`) or Claude Code MCP settings:

```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/claude-metaads/src/index.ts"],
      "env": {
        "META_ACCESS_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

### Option 2: Remote (Claude Web / claude.ai)

Deploy the server (see [Deployment](#deployment) below), then add as a remote MCP integration in Claude.ai:

1. Go to claude.ai > Settings > Integrations
2. Add a custom integration with the URL: `https://your-server.example.com/mcp`
3. If you set `MCP_API_KEY`, configure the authentication header

## Available Tools

### Read Tools

| Tool | Description |
|------|-------------|
| `meta_list_ad_accounts` | List all ad accounts accessible to the user |
| `meta_get_campaigns` | Get campaigns for an ad account with status filtering |
| `meta_get_adsets` | Get ad sets, optionally filtered by campaign |
| `meta_get_ads` | Get ads, optionally filtered by ad set |
| `meta_get_insights` | Get performance analytics with date ranges and breakdowns |
| `meta_get_ad_creatives` | Get ad creative details (images, text, CTAs) |

### Write Tools

| Tool | Description |
|------|-------------|
| `meta_create_campaign` | Create a new campaign (PAUSED by default) |
| `meta_update_campaign` | Update campaign status, budget, or name |
| `meta_update_adset` | Update ad set status, budget, bid, or name |
| `meta_update_ad` | Update ad status or name |

## Example Questions for Claude

- "List my ad accounts"
- "Show me all active campaigns in account 123456789"
- "What's the performance of campaign X in the last 7 days?"
- "Compare CTR and CPC across all campaigns this month"
- "Show me insights broken down by age and gender"
- "Pause campaign 123456"
- "Create a new traffic campaign called 'Summer Sale'"
- "What are my top performing ads by ROAS?"

## Development

### Stdio mode (local, default):

```bash
META_ACCESS_TOKEN=your_token npx tsx src/index.ts
```

### HTTP mode (remote):

```bash
META_ACCESS_TOKEN=your_token MCP_API_KEY=your_secret npx tsx src/index.ts --http
```

The server starts on port 3000 (override with `PORT` env var).

### Build for production:

```bash
npm run build
META_ACCESS_TOKEN=your_token node dist/index.js           # stdio
META_ACCESS_TOKEN=your_token node dist/index.js --http     # http
```

## Deployment

The HTTP mode (`--http`) turns the server into a deployable web service. You can host it on any platform that runs Node.js or Docker.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `META_ACCESS_TOKEN` | Yes | Facebook access token with `ads_read` and `ads_management` permissions |
| `MCP_API_KEY` | Recommended | API key to protect the MCP endpoint. Clients send it as `Authorization: Bearer <key>` |
| `PORT` | No | HTTP port (default: 3000) |

### Deploy on Ubuntu VM + Cloudflare Tunnel

This is the recommended approach for self-hosting. An automated setup script is included.

**On your VM:**

```bash
git clone https://github.com/lucianoboeingmkt/claude-metaads.git /opt/meta-ads-mcp
cd /opt/meta-ads-mcp
sudo bash deploy/setup.sh
```

The script will:
- Install Node.js 22 (if needed)
- Create a `mcp` system user
- Build the project
- Ask for your `META_ACCESS_TOKEN` and `MCP_API_KEY`
- Install and start a systemd service

**Configure Cloudflare Tunnel:**

1. In [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) > Networks > Tunnels
2. Select your tunnel > Public Hostname > Add
3. Set:
   - Subdomain: `mcp` (or your preference)
   - Domain: `yourdomain.com`
   - Service type: `HTTP`
   - URL: `localhost:3000`
4. Your MCP endpoint: `https://mcp.yourdomain.com/mcp`

**Connect to Claude.ai:**

1. Go to claude.ai > Settings > Integrations
2. Add custom integration with URL: `https://mcp.yourdomain.com/mcp`

**Useful commands:**

```bash
sudo systemctl status meta-ads-mcp     # check status
sudo systemctl restart meta-ads-mcp    # restart
sudo journalctl -u meta-ads-mcp -f     # view logs
sudo nano /opt/meta-ads-mcp/.env       # edit config
```

### Deploy with Docker

```bash
docker build -t meta-ads-mcp .
docker run -p 3000:3000 \
  -e META_ACCESS_TOKEN=your_token \
  -e MCP_API_KEY=your_secret \
  meta-ads-mcp
```

### Deploy to Railway

1. Connect your GitHub repo to [Railway](https://railway.app)
2. Set environment variables: `META_ACCESS_TOKEN`, `MCP_API_KEY`
3. Railway detects the Dockerfile automatically
4. Your MCP endpoint will be: `https://your-app.railway.app/mcp`

### Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repo
3. Set environment: `Docker`, add env vars: `META_ACCESS_TOKEN`, `MCP_API_KEY`
4. Your MCP endpoint will be: `https://your-app.onrender.com/mcp`

### Deploy to Fly.io

```bash
fly launch
fly secrets set META_ACCESS_TOKEN=your_token MCP_API_KEY=your_secret
fly deploy
```

Your MCP endpoint will be: `https://your-app.fly.dev/mcp`

### Health Check

All deployments expose a health check at `GET /health` that returns:

```json
{"status":"ok","server":"meta-ads","version":"1.0.0"}
```
