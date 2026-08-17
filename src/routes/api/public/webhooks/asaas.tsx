import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createHmac, timingSafeEqual } from 'crypto'

export const Route = createFileRoute('/api/public/webhooks/asaas')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const bodyText = await request.text();
        const payload = JSON.parse(bodyText);
        
        // 1. Signature Verification
        // Note: Asaas can send a secret header if configured
        const { data: settings } = await supabaseAdmin.from('app_settings').select('asaas_webhook_secret').single();
        const authToken = request.headers.get('asaas-access-token');
        
        if (settings?.asaas_webhook_secret && authToken !== settings.asaas_webhook_secret) {
           return new Response('Unauthorized', { status: 401 });
        }

        // 2. Idempotency Check
        const eventId = payload.event + '_' + payload.payment.id;
        const { data: existing } = await supabaseAdmin
          .from('provider_webhook_events')
          .select('id')
          .eq('provider', 'asaas')
          .eq('external_event_id', eventId)
          .single();

        if (existing) {
          return new Response('Already processed', { status: 200 });
        }

        // 3. Log Event
        const { data: eventRecord } = await supabaseAdmin.from('provider_webhook_events').insert({
          provider: 'asaas',
          external_event_id: eventId,
          event_type: payload.event,
          payload: payload,
          status: 'PROCESSING'
        }).select().single();

        try {
          if (payload.event === 'PAYMENT_RECEIVED' || payload.event === 'PAYMENT_CONFIRMED') {
            const externalRef = payload.payment.externalReference;
            const amount = payload.payment.value;

            // Atomic credit
            // We'll need a new RPC for this to ensure atomicity
            const { error: rpcError } = await supabaseAdmin.rpc('process_confirmed_deposit', {
              p_external_reference: externalRef,
              p_provider_payment_id: payload.payment.id,
              p_amount: amount,
              p_paid_at: new Date().toISOString()
            });

            if (rpcError) throw rpcError;
          }

          await supabaseAdmin.from('provider_webhook_events').update({
            status: 'PROCESSED',
            processed_at: new Date().toISOString()
          }).eq('id', eventRecord.id);

          return new Response('OK', { status: 200 });
        } catch (e: any) {
          await supabaseAdmin.from('provider_webhook_events').update({
            status: 'FAILED',
            error: e.message
          }).eq('id', eventRecord.id);
          return new Response('Internal error', { status: 500 });
        }
      }
    }
  }
})
