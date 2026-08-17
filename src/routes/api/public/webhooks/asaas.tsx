import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute('/api/public/webhooks/asaas')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const bodyText = await request.text();
        const payload = JSON.parse(bodyText);
        
        // 1. Signature Verification
        const webhookSecret = process.env['ASAAS_WEBHOOK_AUTH_TOKEN'];
        const authToken = request.headers.get('asaas-access-token');
        
        if (webhookSecret && authToken !== webhookSecret) {
           console.error('[Asaas Webhook] Unauthorized attempt - Invalid token');
           return new Response('Unauthorized', { status: 401 });
        }
        
        if (!webhookSecret) {
           console.warn('[Asaas Webhook] Token verification skipped - ASAAS_WEBHOOK_AUTH_TOKEN not set');
        }

        // 2. Idempotency Check
        const eventId = payload.event + '_' + payload.payment.id;
        const { data: existing } = await supabaseAdmin
          .from('provider_webhook_events' as any)
          .select('id')
          .eq('provider', 'asaas')
          .eq('external_event_id', eventId)
          .single();

        if (existing) {
          return new Response('Already processed', { status: 200 });
        }

        // 3. Log Event
        const { data: eventRecord, error: insertError } = await supabaseAdmin.from('provider_webhook_events' as any).insert({
          provider: 'asaas',
          external_event_id: eventId,
          event_type: payload.event,
          payload: payload,
          status: 'PROCESSING'
        }).select().single();

        if (insertError || !eventRecord) {
          return new Response('Database error', { status: 500 });
        }

        try {
          if (payload.event === 'PAYMENT_RECEIVED' || payload.event === 'PAYMENT_CONFIRMED') {
            // Validate basic payload requirements
            if (!payload.payment || !payload.payment.id || !payload.payment.externalReference) {
              throw new Error('INVALID_PAYLOAD_STRUCTURE');
            }
            const externalRef = payload.payment.externalReference;
            const amount = payload.payment.value;

            // Atomic credit
            const { error: rpcError } = await supabaseAdmin.rpc('process_confirmed_deposit', {
              p_external_reference: externalRef,
              p_provider_payment_id: payload.payment.id,
              p_amount: amount,
              p_paid_at: new Date().toISOString()
            });

            if (rpcError) throw rpcError;
          }

          await supabaseAdmin.from('provider_webhook_events' as any).update({
            status: 'PROCESSED',
            processed_at: new Date().toISOString()
          }).eq('id', (eventRecord as any).id);

          return new Response('OK', { status: 200 });
        } catch (e: any) {
          await supabaseAdmin.from('provider_webhook_events' as any).update({
            status: 'FAILED',
            error: e.message
          }).eq('id', (eventRecord as any).id);
          return new Response('Internal error', { status: 500 });
        }
      }
    }
  }
})
