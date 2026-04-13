import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FacebookClient } from '../facebook-client.js';

export function registerCreateCampaignTool(server: McpServer, client: FacebookClient): void {
  server.tool(
    'meta_create_campaign',
    'Create a new campaign in an ad account. Creates in PAUSED status by default for safety.',
    {
      account_id: z.string().describe('Ad account ID (numeric, without "act_" prefix)'),
      name: z.string().describe('Campaign name'),
      objective: z.enum([
        'OUTCOME_TRAFFIC',
        'OUTCOME_ENGAGEMENT',
        'OUTCOME_LEADS',
        'OUTCOME_SALES',
        'OUTCOME_AWARENESS',
      ]).describe('Campaign objective'),
      status: z.enum(['ACTIVE', 'PAUSED']).optional().describe('Campaign status (default: PAUSED)'),
      daily_budget: z.string().optional().describe('Daily budget in cents (e.g., "5000" for $50.00)'),
      lifetime_budget: z.string().optional().describe('Lifetime budget in cents (e.g., "100000" for $1000.00)'),
      special_ad_categories: z.string().optional().describe('JSON array of special ad categories (e.g., \'["HOUSING"]\')'),
    },
    async (args) => {
      try {
        const data: Record<string, string> = {
          name: args.name,
          objective: args.objective,
          status: args.status ?? 'PAUSED',
          special_ad_categories: args.special_ad_categories ?? '[]',
        };
        if (args.daily_budget) data.daily_budget = args.daily_budget;
        if (args.lifetime_budget) data.lifetime_budget = args.lifetime_budget;

        const result = await client.post(`/act_${args.account_id}/campaigns`, data);

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

export function registerUpdateCampaignTool(server: McpServer, client: FacebookClient): void {
  server.tool(
    'meta_update_campaign',
    'Update an existing campaign (pause/activate, change budget, rename)',
    {
      campaign_id: z.string().describe('Campaign ID to update'),
      name: z.string().optional().describe('New campaign name'),
      status: z.enum(['ACTIVE', 'PAUSED']).optional().describe('New status'),
      daily_budget: z.string().optional().describe('New daily budget in cents'),
      lifetime_budget: z.string().optional().describe('New lifetime budget in cents'),
    },
    async (args) => {
      try {
        const data: Record<string, string> = {};
        if (args.name) data.name = args.name;
        if (args.status) data.status = args.status;
        if (args.daily_budget) data.daily_budget = args.daily_budget;
        if (args.lifetime_budget) data.lifetime_budget = args.lifetime_budget;

        const result = await client.post(`/${args.campaign_id}`, data);

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
