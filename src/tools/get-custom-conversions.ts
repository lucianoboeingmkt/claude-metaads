import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FacebookClient } from '../facebook-client.js';

const DEFAULT_FIELDS = 'id,name,description,rule';

export function registerGetCustomConversionsTool(server: McpServer, client: FacebookClient): void {
  server.tool(
    'meta_get_custom_conversions',
    'Get custom conversions for a specific ad account',
    {
      account_id: z.string().describe('Ad account ID (numeric, without "act_" prefix)'),
      fields: z.string().optional().describe(`Comma-separated fields. Default: ${DEFAULT_FIELDS}`),
      limit: z.number().optional().describe('Max results to return (default 25, max 100)'),
    },
    async (args) => {
      try {
        const params: Record<string, string> = {
          fields: args.fields ?? DEFAULT_FIELDS,
        };
        if (args.limit) params.limit = String(args.limit);

        const result = await client.get(`/act_${args.account_id}/customconversions`, params);

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
