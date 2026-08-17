import { z } from "zod";

export const pricingConfigSchema = z.object({
  global_margin_percentage: z.number().default(0),
  min_stake: z.number().default(10),
  max_stake: z.number().nullable().default(null),
  max_payout: z.number().default(50000),
  max_ticket_selections: z.number().default(15),
  betting_enabled: z.boolean().default(true),
});

export type PricingConfig = z.infer<typeof pricingConfigSchema>;

export async function getPricingConfig(): Promise<PricingConfig> {
  // We'll simulate fetching from DB for now as app_settings might not exist in schema yet
  // or return default if there's any schema mismatch
  return pricingConfigSchema.parse({});
}

export function calculateDisplayOdd(providerOdd: number, marginPercentage: number): number {
  if (marginPercentage <= 0) return providerOdd;
  const displayOdd = providerOdd * (1 - (marginPercentage / 100));
  return Math.max(1.01, Number(displayOdd.toFixed(2)));
}
