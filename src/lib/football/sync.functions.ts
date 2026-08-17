import { createServerFn } from "@tanstack/react-start";
import { syncCompetitions, syncFixtures } from "./sync.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { syncMockData } from "./sync.server";


export const runFullSync = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      // For Phase 2, we use mock data sync instead of real API
      return await syncMockData();
    } catch (e) {
      // Fallback if environment is not set up for real sync yet
      console.error("Sync error:", e);
      throw e;
    }
  });

export const getInternalSyncLogs = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await supabaseAdmin
      .from("sync_logs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(20);
    return data || [];
  });
