import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FacebookClient } from '../facebook-client.js';

const DEFAULT_FIELDS = 'id,name,account_status,currency,timezone_name,amount_spent';

export function registerListAdAccountsTool(server: McpServer, client: FacebookClient): void {
  server.tool(
    'meta_list_ad_accounts',
    'List all ad accounts accessible to the authenticated user',
    {
      limit: z.number().optional().describe('Max number of accounts to return (default 25, max 100)'),
      fields: z.string().optional().describe(`Comma-separated fields to return. Default: ${DEFAULT_FIELDS}`),
    },
    async (args) => {
      try {
        const params: Record<string, string> = {
          fields: args.fields ?? DEFAULT_FIELDS,
        };
        if (args.limit) params.limit = String(args.limit);

        const result = await client.get('/me/adaccounts', params);

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}
