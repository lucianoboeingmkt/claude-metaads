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
  const port = parseInt(process.env.PORT ?? '3000', 10);
  const apiKey = process.env.MCP_API_KEY;

  const app = createMcpExpressApp({ host: '0.0.0.0' });

  // Authentication middleware for the MCP endpoint
  app.use('/mcp', (req, res, next) => {
    if (apiKey) {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
        res.status(401).json({
          jsonrpc: '2.0',
          error: { code: -32001, message: 'Unauthorized: invalid or missing API key' },
          id: null,
        });
        return;
      }
    }
    next();
  });

  app.post('/mcp', async (req, res) => {
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
  app.get('/mcp', (_req, res) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed. Use POST.' },
      id: null,
    });
  });

  app.delete('/mcp', (_req, res) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null,
    });
  });

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', server: 'meta-ads', version: '1.0.0' });
  });

  app.listen(port, () => {
    console.log(`Meta Ads MCP Server (HTTP) listening on port ${port}`);
    console.log(`MCP endpoint: http://0.0.0.0:${port}/mcp`);
    console.log(`Health check: http://0.0.0.0:${port}/health`);
    if (apiKey) {
      console.log('Authentication: enabled (MCP_API_KEY is set)');
    } else {
      console.log('Authentication: disabled (set MCP_API_KEY to enable)');
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
