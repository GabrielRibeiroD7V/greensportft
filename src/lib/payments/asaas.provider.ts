import { PaymentProvider, ExternalDepositResult, PaymentStatus } from "./provider.interface";

export class AsaasPaymentProvider implements PaymentProvider {
  name = "asaas";
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string, environment: 'SANDBOX' | 'PRODUCTION') {
    this.apiKey = apiKey;
    this.baseUrl = environment === 'PRODUCTION' 
      ? "https://www.asaas.com/api/v3" 
      : "https://sandbox.asaas.com/api/v3";
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        "access_token": this.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.errors?.[0]?.description || `Asaas error: ${response.statusText}`);
    }

    return response.json();
  }

  async testConnection() {
    try {
      await this.fetch("/payments?limit=1");
      return { success: true, message: "Conectado ao Asaas", code: "CONNECTED" };
    } catch (e: any) {
      return { success: false, message: e.message, code: "INVALID_CREDENTIALS" };
    }
  }

  async createDeposit(params: {
    amount: number;
    externalReference: string;
    idempotencyKey?: string;
  }): Promise<ExternalDepositResult> {
    const payload = {
      billingType: "PIX",
      value: params.amount,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      externalReference: params.externalReference,
    };

    const payment = await this.fetch("/payments", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const qrCode = await this.fetch(`/payments/${payment.id}/pixQrCode`);

    return {
      providerPaymentId: payment.id,
      pixQrCode: qrCode.encodedImage,
      pixCopyPaste: qrCode.payload,
      expiresAt: payment.dueDate,
      providerStatus: payment.status,
    };
  }

  async getPaymentStatus(providerId: string): Promise<{ status: PaymentStatus; providerStatus: string }> {
    const payment = await this.fetch(`/payments/${providerId}`);
    return {
      status: this.mapStatus(payment.status),
      providerStatus: payment.status,
    };
  }

  private mapStatus(asaasStatus: string): PaymentStatus {
    switch (asaasStatus) {
      case 'PENDING': return 'WAITING_PAYMENT';
      case 'RECEIVED':
      case 'CONFIRMED': return 'PAID';
      case 'OVERDUE': return 'EXPIRED';
      case 'REFUNDED': return 'REFUNDED';
      default: return 'CANCELLED';
    }
  }
}
