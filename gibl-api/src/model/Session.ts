import { defineModel } from 'express-file-cluster';

export interface SessionDocument {
  userId: string;
  token: string;
  ip: string;
  userAgent: string;
  expiresAt: Date;
  isActive: boolean;
}

export const Session = defineModel<SessionDocument>('Session', {
  userId:    { type: 'string',  required: true },
  token:     { type: 'string',  required: true, unique: true },
  ip:        { type: 'string',  required: true },
  userAgent: { type: 'string',  required: true },
  expiresAt: { type: 'date',    required: true },
  isActive:  { type: 'boolean', default: true },
});
