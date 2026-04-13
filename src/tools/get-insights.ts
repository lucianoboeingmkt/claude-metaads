import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FacebookClient } from '../facebook-client.js';

const DEFAULT_FIELDS = 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type,conversions,conversion_values,purchase_roas';

export function registerGetInsightsTool(server: McpServer, client: FacebookClient): void {
  server.tool(
    'meta_get_insights',
    'Get performance analytics (spend, impressions, clicks, CTR, CPC, conversions, etc.) for an account, campaign, ad set, or ad. Supports date ranges and breakdowns.',
    {
      entity_id: z.string().describe('The ID to query insights for. Use "act_XXXXX" for account-level, or a campaign/adset/ad ID'),
      date_preset: z.enum([
        'today', 'yesterday', 'this_month', 'last_month',
        'this_quarter', 'maximum', 'last_3d', 'last_7d',
        'last_14d', 'last_28d', 'last_30d', 'last_90d',
        'last_week_mon_sun', 'last_week_sun_sat',
        'last_quarter', 'last_year', 'this_week_mon_today',
        'this_week_sun_today', 'this_year',
      ]).optional().describe('Predefined date range. Ignored if date_from/date_to are set.'),
      date_from: z.string().optional().describe('Start date in YYYY-MM-DD format'),
      date_to: z.string().optional().describe('End date in YYYY-MM-DD format'),
      level: z.enum(['account', 'campaign', 'adset', 'ad']).optional().describe('Aggregation level. Default depends on entity type.'),
      fields: z.string().optional().describe(`Comma-separated insight fields. Default: ${DEFAULT_FIELDS}`),
      breakdowns: z.string().optional().describe('Comma-separated breakdown dimensions (e.g., age,gender,country,publisher_platform,device_platform)'),
      time_increment: z.string().optional().describe('"1" for daily, "7" for weekly, "monthly" for monthly, or "all_days" for aggregate'),
      limit: z.number().optional().describe('Max rows to return (default 25, max 100)'),
      after: z.string().optional().describe('Pagination cursor'),
    },
    async (args) => {
      try {
        const params: Record<string, string> = {
          fields: args.fields ?? DEFAULT_FIELDS,
        };

        if (args.date_from && args.date_to) {
          params.time_range = JSON.stringify({ since: args.date_from, until: args.date_to });
        } else if (args.date_preset) {
          params.date_preset = args.date_preset;
        } else {
          params.date_preset = 'last_30d';
        }

        if (args.level) params.level = args.level;
        if (args.breakdowns) params.breakdowns = args.breakdowns;
        if (args.time_increment) params.time_increment = args.time_increment;
        if (args.limit) params.limit = String(args.limit);
        if (args.after) params.after = args.after;

        const result = await client.get(`/${args.entity_id}/insights`, params);

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
