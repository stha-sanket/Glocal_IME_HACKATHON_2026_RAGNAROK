import { defineModel } from 'express-file-cluster';

export interface SubscriptionDocument {
  userId: string;
  planId: string;
  status: string;
  startDate: Date;
  endDate: Date;
  cancelledAt?: Date;
}

export const Subscription = defineModel<SubscriptionDocument>('Subscription', {
  userId:      { type: 'string', required: true },
  planId:      { type: 'string', required: true },
  status:      { type: 'string', required: true, default: 'active' },
  startDate:   { type: 'date',   required: true },
  endDate:     { type: 'date',   required: true },
  cancelledAt: { type: 'date' },
});
