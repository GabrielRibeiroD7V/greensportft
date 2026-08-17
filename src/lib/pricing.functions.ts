import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getPricingConfig } from "./pricing.server";

export const getPublicPricingConfig = createServerFn({ method: "GET" }).handler(async () => {
  return await getPricingConfig();
});
