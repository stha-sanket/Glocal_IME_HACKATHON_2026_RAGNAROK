import { defineModel } from 'express-file-cluster';

export interface CouponDocument {
  code: string;
  type: string;
  value: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: Date;
  isActive: boolean;
}

export const Coupon = defineModel<CouponDocument>('Coupon', {
  code:      { type: 'string',  required: true, unique: true },
  type:      { type: 'string',  required: true, default: 'percent' },
  value:     { type: 'number',  required: true },
  maxUses:   { type: 'number',  default: 0 },
  usedCount: { type: 'number',  default: 0 },
  expiresAt: { type: 'date' },
  isActive:  { type: 'boolean', default: true },
});
