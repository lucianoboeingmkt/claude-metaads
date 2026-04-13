import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FacebookClient } from '../facebook-client.js';

const DEFAULT_FIELDS = 'id,name,title,body,image_url,thumbnail_url,url_tags,object_story_spec,asset_feed_spec,call_to_action_type';

export function registerGetAdCreativesTool(server: McpServer, client: FacebookClient): void {
  server.tool(
    'meta_get_ad_creatives',
    'Get ad creative details including thumbnail URLs, body text, titles, call-to-action, and links',
    {
      account_id: z.string().describe('Ad account ID (numeric, without "act_" prefix)'),
      creative_id: z.string().optional().describe('Specific creative ID to fetch. If omitted, lists all creatives for the account.'),
      limit: z.number().optional().describe('Max results (default 25, max 100)'),
      fields: z.string().optional().describe(`Comma-separated fields. Default: ${DEFAULT_FIELDS}`),
      after: z.string().optional().describe('Pagination cursor'),
    },
    async (args) => {
      try {
        const params: Record<string, string> = {
          fields: args.fields ?? DEFAULT_FIELDS,
        };
        if (args.limit) params.limit = String(args.limit);
        if (args.after) params.after = args.after;

        const path = args.creative_id
          ? `/${args.creative_id}`
          : `/act_${args.account_id}/adcreatives`;

        const result = await client.get(path, params);

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
