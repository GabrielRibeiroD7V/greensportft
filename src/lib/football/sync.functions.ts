import { createServerFn } from "@tanstack/react-start";
import { syncCompetitions, syncFixtures } from "./sync.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { syncMockData } from "./sync.server";


export const runFullSync = createServerFn({ method: "POST" })
  .handler(async () => {
    // 1. Sync Competitions
    const compResult = await syncCompetitions();
    
    // 2. Sync Fixtures for each competition (current year)
    const { data: competitions } = await supabaseAdmin
      .from("competitions")
      .select("id")
      .eq("is_active", true);

    const currentYear = new Date().getFullYear();
    let totalFixtures = 0;

    if (competitions) {
      for (const comp of competitions) {
        const fixResult = await syncFixtures(comp.id, currentYear);
        totalFixtures += fixResult.created;
      }
    }

    return {
      competitions: compResult,
      fixturesSynced: totalFixtures
    };
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
