import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { AsaasPaymentProvider } from "./payments/asaas.provider";
import { Database } from "@/integrations/supabase/types";

export const getWalletData = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (walletError) throw walletError;

    const { data: recentTransactions, error: txError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (txError) throw txError;

    const { data: activeDeposits, error: depError } = await supabase
      .from("deposits")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

    if (depError) throw depError;

    return {
      wallet,
      recentTransactions,
      activeDeposits
    };
  });

export const createDepositFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    amount: z.number().min(10),
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Get settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("*")
      .single();

    const mode = settings?.payment_mode || 'SIMULATION';
    const minDeposit = Number(settings?.min_deposit || 10);
    const maxDeposit = Number(settings?.max_deposit || 10000);
    const depositsEnabled = settings?.deposits_enabled !== false;
    const asaasKey = process.env['ASAAS_API_KEY'];

    if (!depositsEnabled) throw new Error("Deposits are currently disabled");
    if (data.amount < minDeposit) throw new Error(`Minimum deposit is R$ ${minDeposit}`);
    if (data.amount > maxDeposit) throw new Error(`Maximum deposit is R$ ${maxDeposit}`);

    const externalReference = `DEP_${user.id}_${Date.now()}`;
    
    // 2. Routing between providers
    if (mode === 'SIMULATION' || !asaasKey) {
      const { data: deposit, error } = await supabase.from("deposits").insert({
        user_id: user.id,
        amount: data.amount,
        status: 'PENDING',
        provider: 'simulation',
        external_reference: externalReference,
        is_simulated: true,
        pix_copy_paste: null,
        pix_qr_code: null,
        expires_at: null,
        provider_payment_id: null,
        provider_status: 'PENDING',
        error_log: null,
        idempotency_key: null,
        paid_at: null
      }).select().single();

      if (error) throw error;
      return { deposit };
    } else {
      // Real Asaas Integration
      const asaasMode = mode as 'SIMULATION' | 'SANDBOX' | 'PRODUCTION';
      const asaas = new AsaasPaymentProvider(asaasKey, asaasMode);
      
      const asaasResult = await asaas.createDeposit({
        amount: data.amount,
        externalReference
      });

      const { data: deposit, error } = await supabase.from("deposits").insert({
        user_id: user.id,
        amount: data.amount,
        status: 'PENDING',
        provider: 'asaas',
        provider_payment_id: asaasResult.providerPaymentId,
        external_reference: externalReference,
        is_simulated: mode !== 'PRODUCTION',
        pix_qr_code: asaasResult.pixQrCode || null,
        pix_copy_paste: asaasResult.pixCopyPaste || null,
        expires_at: asaasResult.expiresAt ? new Date(asaasResult.expiresAt).toISOString() : null,
        provider_status: asaasResult.providerStatus,
        error_log: null,
        idempotency_key: null,
        paid_at: null
      }).select().single();

      if (error) throw error;
      return { deposit };
    }
  });

export const requestWithdrawalFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({
    amount: z.number().min(20),
    pixKey: z.string().min(5),
    pixKeyType: z.enum(['CPF', 'EMAIL', 'PHONE', 'RANDOM'])
  }).parse(data))
  .handler(async ({ data }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: settings } = await supabase.from("app_settings").select("*").single();
    const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();

    if (!wallet || (wallet.balance ?? 0) < data.amount) throw new Error("Insufficient balance");
    if (settings?.withdrawals_enabled === false) throw new Error("Withdrawals are currently disabled");

    const mode = settings?.payment_mode || 'SIMULATION';

    const { error: rpcError } = await (supabase.rpc as any)('request_withdrawal', {
      p_amount: data.amount,
      p_user_id: user.id,
      p_pix_key: data.pixKey,
      p_pix_key_type: data.pixKeyType,
      p_provider: mode === 'SIMULATION' ? 'simulation' : 'asaas',
      p_is_simulated: mode !== 'PRODUCTION'
    });

    if (rpcError) throw rpcError;
    return { success: true };
  });
