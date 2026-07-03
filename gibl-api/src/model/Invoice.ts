import { defineModel } from 'express-file-cluster';

export interface InvoiceDocument {
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: Date;
}

export const Invoice = defineModel<InvoiceDocument>('Invoice', {
  userId:         { type: 'string', required: true },
  subscriptionId: { type: 'string', required: true },
  amount:         { type: 'number', required: true },
  currency:       { type: 'string', required: true, default: 'USD' },
  status:         { type: 'string', required: true, default: 'pending' },
  paidAt:         { type: 'date' },
});
