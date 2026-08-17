export type PaymentStatus = 'PENDING' | 'WAITING_PAYMENT' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'FAILED' | 'REFUNDED';
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REJECTED' | 'CANCELLED';

export interface PaymentProvider {
  name: string;
  testConnection(): Promise<{ success: boolean; message: string; code: string }>;
  createDeposit(params: {
    amount: number;
    externalReference: string;
    customerId?: string;
    idempotencyKey?: string;
  }): Promise<ExternalDepositResult>;
  getPaymentStatus(providerId: string): Promise<{ status: PaymentStatus; providerStatus: string }>;
}

export interface ExternalDepositResult {
  providerPaymentId: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  expiresAt?: string;
  providerStatus: string;
}
