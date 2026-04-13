import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { FacebookClient } from './facebook-client.js';

import { registerListAdAccountsTool } from './tools/list-ad-accounts.js';
import { registerGetCampaignsTool } from './tools/get-campaigns.js';
import { registerGetAdsetsTool } from './tools/get-adsets.js';
import { registerGetAdsTool } from './tools/get-ads.js';
import { registerGetInsightsTool } from './tools/get-insights.js';
import { registerGetAdCreativesTool } from './tools/get-ad-creatives.js';
import { registerCreateCampaignTool, registerUpdateCampaignTool } from './tools/manage-campaign.js';
import { registerUpdateAdsetTool } from './tools/manage-adset.js';
import { registerUpdateAdTool } from './tools/manage-ad.js';

const accessToken = process.env.META_ACCESS_TOKEN;
if (!accessToken) {
  console.error('ERROR: META_ACCESS_TOKEN environment variable is required.');
  console.error('Set it with your Facebook access token that has ads_read and ads_management permissions.');
  process.exit(1);
}

const client = new FacebookClient(accessToken);

const server = new McpServer({
  name: 'meta-ads',
  version: '1.0.0',
});

// Read tools
registerListAdAccountsTool(server, client);
registerGetCampaignsTool(server, client);
registerGetAdsetsTool(server, client);
registerGetAdsTool(server, client);
registerGetInsightsTool(server, client);
registerGetAdCreativesTool(server, client);

// Write tools
registerCreateCampaignTool(server, client);
registerUpdateCampaignTool(server, client);
registerUpdateAdsetTool(server, client);
registerUpdateAdTool(server, client);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
