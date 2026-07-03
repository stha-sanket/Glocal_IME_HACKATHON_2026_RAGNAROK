import { defineModel } from 'express-file-cluster';

export interface ApiKeyDocument {
  userId: string;
  name: string;
  key: string;
  lastUsed?: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export const ApiKey = defineModel<ApiKeyDocument>('ApiKey', {
  userId:   { type: 'string',  required: true },
  name:     { type: 'string',  required: true },
  key:      { type: 'string',  required: true, unique: true },
  lastUsed: { type: 'date' },
  expiresAt:{ type: 'date' },
  isActive: { type: 'boolean', default: true },
});
