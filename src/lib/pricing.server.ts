import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

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
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .single();

  if (error || !data) {
    return pricingConfigSchema.parse({});
  }

  return pricingConfigSchema.parse(data);
}

export function calculateDisplayOdd(providerOdd: number, marginPercentage: number): number {
  if (marginPercentage <= 0) return providerOdd;
  const displayOdd = providerOdd * (1 - (marginPercentage / 100));
  return Math.max(1.01, Number(displayOdd.toFixed(2)));
}
