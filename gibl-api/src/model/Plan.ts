import { defineModel } from 'express-file-cluster';

export interface PlanDocument {
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  isActive: boolean;
}

export const Plan = defineModel<PlanDocument>('Plan', {
  name:        { type: 'string',  required: true },
  description: { type: 'string',  required: true },
  price:       { type: 'number',  required: true },
  interval:    { type: 'string',  required: true, default: 'monthly' },
  features:    { type: 'array',   default: [] },
  isActive:    { type: 'boolean', default: true },
});
