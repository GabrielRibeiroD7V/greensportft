# Phase 2A: Real Football Data Integration

This plan implements the infrastructure to ingest and synchronize real-world football data into GreenSport, replacing simulated data while maintaining architectural flexibility.

## 1. Database Schema Evolution
Add mapping and sync logging tables to handle external provider relationships.
- Create `provider_mappings` table (Internal ID, Provider, External ID, Entity Type).
- Create `sync_logs` table (Provider, Sync Type, Records Created/Updated, Errors).
- Update existing tables (`competitions`, `teams`, `fixtures`) with `provider_id` and `last_updated` fields.
- Add unique constraints for idempotency: `(provider, provider_entity_id, entity_type)`.

## 2. Football Provider Abstraction
Implement a provider-agnostic layer.
- `src/lib/football/provider.interface.ts`: Define `FootballProvider` interface.
- `src/lib/football/api-football.provider.ts`: Concrete implementation for API-Football.
- Use `process.env['API_FOOTBALL_KEY']` exclusively on the server.

## 3. Synchronization Services
Robust backend services for data ingestion.
- `src/lib/football/sync.server.ts`: Logic for `syncCompetitions`, `syncTeams`, `syncFixtures`.
- Implement `UPSERT` logic to prevent duplicates.
- Handle rate limits and partial failures with logging.

## 4. Frontend & Admin Integration
- Update `/football` to use synchronized data (handling "Live", "Today", "Next Games" logic).
- Connect Admin `/admin/matches` and create `/admin/competitions` to manage real data.
- Add a "Sync Now" button in the Admin dashboard for authorized users.

## 5. Technical Details
- **Timezone**: All dates stored as UTC; `date-fns-tz` for display.
- **Rate Limiting**: Implementation will batch requests where possible.
- **Fallbacks**: UI will use stale Supabase data if provider is unreachable.
- **Integrity**: `place_bet` RPC remains untouched to ensure transactional safety.
