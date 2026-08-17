import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { AsaasPaymentProvider } from "./payments/asaas.provider";
import { requireSupabaseAuth } from "@/start";

export const getWalletData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: wallet, error: walletError } = await context.supabase
      .from("wallets")
      .select("*")
      .eq("user_id", context.userId)
      .single();

    if (walletError) throw walletError;

    const { data: recentTransactions, error: txError } = await context.supabase
      .from("ledger")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (txError) throw txError;

    const { data: activeDeposits, error: depError } = await context.supabase
      .from("deposits")
      .select("*")
      .eq("user_id", context.userId)
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
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    amount: z.number().min(10), // This should ideally come from app_settings
  }).parse(data))
  .handler(async ({ data, context }) => {
    // 1. Get settings
    const { data: settings } = await context.supabase
      .from("app_settings")
      .select("*")
      .single();

    const mode = (settings as any)?.payment_mode || 'SIMULATION';
    const minDeposit = Number((settings as any)?.min_deposit || 10);
    const maxDeposit = Number((settings as any)?.max_deposit || 10000);
    const depositsEnabled = (settings as any)?.deposits_enabled !== false;

    if (!depositsEnabled) throw new Error("Deposits are currently disabled");
    if (data.amount < minDeposit) throw new Error(`Minimum deposit is R$ ${minDeposit}`);
    if (data.amount > maxDeposit) throw new Error(`Maximum deposit is R$ ${maxDeposit}`);

    const externalReference = `DEP_${context.userId}_${Date.now()}`;
    
    // 2. Routing between providers
    if (mode === 'SIMULATION') {
      const { data: deposit, error } = await context.supabase.from("deposits").insert({
        user_id: context.userId,
        amount: data.amount,
        status: 'PENDING',
        provider: 'simulation',
        external_reference: externalReference,
        is_simulated: true
      }).select().single();

      if (error) throw error;
      return { deposit };
    } else {
      // Real Asaas Integration
      const asaas = new AsaasPaymentProvider();
      
      // We need user info for Asaas (name, cpf/email)
      // In a real app, we'd fetch these from a profiles table
      const { data: profile } = await context.supabase
        .from("profiles" as any)
        .select("*")
        .eq("id", context.userId)
        .single();

      const asaasResult = await asaas.createDeposit({
        amount: data.amount,
        userId: context.userId,
        externalReference,
        customer: {
          name: (profile as any)?.full_name || 'Usuário GreenSport',
          cpfCnpj: (profile as any)?.cpf || '00000000000', // Placeholder
          email: (profile as any)?.email
        }
      });

      const { data: deposit, error } = await context.supabase.from("deposits").insert({
        user_id: context.userId,
        amount: data.amount,
        status: 'PENDING',
        provider: 'asaas',
        provider_payment_id: asaasResult.providerPaymentId,
        external_reference: externalReference,
        is_simulated: mode !== 'PRODUCTION',
        pix_qr_code: asaasResult.pixQrCode,
        pix_copy_paste: asaasResult.pixCopyPaste,
        expires_at: asaasResult.expiresAt.toISOString()
      }).select().single();

      if (error) throw error;
      return { deposit };
    }
  });

export const requestWithdrawalFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({
    amount: z.number().min(20),
    pixKey: z.string().min(5),
    pixKeyType: z.enum(['CPF', 'EMAIL', 'PHONE', 'RANDOM'])
  }).parse(data))
  .handler(async ({ data, context }) => {
    // 1. Get settings and wallet
    const { data: settings } = await context.supabase.from("app_settings").select("*").single();
    const { data: wallet } = await context.supabase.from("wallets").select("balance").eq("user_id", context.userId).single();

    if (!wallet || wallet.balance < data.amount) throw new Error("Insufficient balance");
    if ((settings as any)?.withdrawals_enabled === false) throw new Error("Withdrawals are currently disabled");

    const mode = (settings as any)?.payment_mode || 'SIMULATION';

    // Atomic withdrawal request (stored procedure/RPC for balance lock recommended but let's use transaction logic)
    const { error: rpcError } = await context.supabase.rpc('request_withdrawal', {
      p_amount: data.amount,
      p_pix_key: data.pixKey,
      p_pix_key_type: data.pixKeyType,
      p_provider: mode === 'SIMULATION' ? 'simulation' : 'asaas',
      p_is_simulated: mode !== 'PRODUCTION'
    });

    if (rpcError) throw rpcError;
    return { success: true };
  });
