type PaymentType = {
  id: string;
  amount: number;
  status: 'succeeded' | 'expired' | 'pending';
  paymentType: string;
  processor: string;
  traceId?: string;
  snapshotId?: string;
  memo?: string;
  payUrl?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}
