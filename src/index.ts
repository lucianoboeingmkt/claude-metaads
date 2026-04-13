import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
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

function createServer(): McpServer {
  const client = new FacebookClient(accessToken!);

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

  return server;
}

async function startStdio() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function startHttp() {
  const port = parseInt(process.env.PORT ?? '3005', 10);
  const secretPath = process.env.MCP_SECRET_PATH;

  // The MCP endpoint path: /mcp/<secret> if MCP_SECRET_PATH is set, otherwise /mcp
  const mcpPath = secretPath ? `/mcp/${secretPath}` : '/mcp';

  const app = createMcpExpressApp({ host: '0.0.0.0' });

  app.post(mcpPath, async (req, res) => {
    const server = createServer();
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless mode
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);

      res.on('close', () => {
        transport.close();
        server.close();
      });
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  });

  // Reject GET and DELETE for stateless mode
  app.get(mcpPath, (_req, res) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed. Use POST.' },
      id: null,
    });
  });

  app.delete(mcpPath, (_req, res) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null,
    });
  });

  // Health check endpoint (always at /health, no secret needed)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', server: 'meta-ads', version: '1.0.0' });
  });

  app.listen(port, () => {
    console.log(`Meta Ads MCP Server (HTTP) listening on port ${port}`);
    console.log(`MCP endpoint: http://0.0.0.0:${port}${mcpPath}`);
    console.log(`Health check: http://0.0.0.0:${port}/health`);
    if (secretPath) {
      console.log('Security: secret path enabled');
    } else {
      console.log('WARNING: No MCP_SECRET_PATH set — endpoint is open at /mcp');
    }
  });
}

const mode = process.argv[2];

if (mode === '--http') {
  startHttp().catch((error) => {
    console.error('Failed to start HTTP server:', error);
    process.exit(1);
  });
} else {
  startStdio().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}
