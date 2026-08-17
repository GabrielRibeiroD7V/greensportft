# Plan: GreenSport Phase 5C - Secure Asaas Payment Integration

Implementation of the financial infrastructure for real Pix payments via Asaas, maintaining a simulation mode for development.

## User Review Required

> [!IMPORTANT]
> This phase establishes the architecture for real financial transactions. Real payments will remain locked until valid Asaas credentials (API Key/Webhook Secret) are provided in the environment variables.

- **Asaas Credentials**: Requires `ASAAS_API_KEY` and `ASAAS_WEBHOOK_SECRET` for real/sandbox operations.
- **Webhook Endpoint**: `/api/public/webhooks/asaas` will be created to receive payment confirmations.

## Proposed Changes

### Database & Schema
- **Tables Expansion**:
    - Update `deposits`: add `provider`, `provider_payment_id`, `provider_status`, `external_reference`, `idempotency_key`, `is_simulated`, `expires_at`, `paid_at`, `pix_qr_code`, `pix_copy_paste`.
    - Update `withdrawals`: add `provider`, `provider_withdrawal_id`, `provider_status`, `is_simulated`, `pix_key`, `pix_key_type`.
    - Create `provider_webhook_events`: log all incoming webhooks with status tracking.
- **Settings**: Add `payment_mode` (`SIMULATION`, `SANDBOX`, `PRODUCTION`), `min_deposit`, `max_deposit`, `deposits_enabled`, `withdrawals_enabled` to `app_settings`.
- **RBAC**: Strictly lock manual updates to `deposits` and `withdrawals` for non-admins.

### Backend Infrastructure
- **Payment Provider Abstraction**:
    - `src/lib/payments/provider.interface.ts`: Generic interface for payment operations.
    - `src/lib/payments/asaas.provider.ts`: Concrete implementation using Asaas API.
- **Server Functions**:
    - `createDeposit`: Handles both simulation and real Pix generation.
    - `getDepositStatus`: For client-side polling/updates.
    - `testPaymentConnection`: Admin tool to verify API keys.
- **Webhook Handler**:
    - `src/routes/api/public/webhooks/asaas.ts`: Public endpoint to process Asaas events with signature verification and idempotency.

### Admin Panel
- **Integrations**: Expand `/admin/integrations` with a "Payments" card showing Asaas status and configuration.
- **Finance**: Update `/admin/finance` to show detailed deposit/withdrawal logs with provider IDs and data modes.

### User Experience
- **Wallet**: Enhanced deposit flow with Pix QR Code display and real-time status updates (polling + webhook).
- **History**: Clear separation between simulated and real transaction history.

## Technical Details
- **Idempotency**: Use `external_reference` (e.g., `GS-DEP-UUID`) to prevent double-charging.
- **Atomic Transactions**: Wallet credits only occur inside a database transaction after webhook validation.
- **Security**: Asaas API key is strictly server-side; webhooks must pass signature verification.

## Verification Plan
### Automated Tests
- [ ] TypeScript: `bunx tsgo --noEmit`
- [ ] SSR: `bun run build`

### Manual Verification
1. **Simulation**: Verify that Pix deposits still work in `SIMULATION` mode without an API key.
2. **Admin**: Toggle between modes and verify that `REAL` is blocked without credentials.
3. **Webhook Mock**: Manually trigger a mock webhook event to verify atomic wallet credit.
4. **Security**: Attempt to credit a wallet as a non-admin user (should fail).
