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

Run the server directly:

```bash
META_ACCESS_TOKEN=your_token npx tsx src/index.ts
```

Build for production:

```bash
npm run build
META_ACCESS_TOKEN=your_token node dist/index.js
```
