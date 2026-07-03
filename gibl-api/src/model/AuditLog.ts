import { defineModel } from 'express-file-cluster';

export interface AuditLogDocument {
  adminId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ip: string;
}

export const AuditLog = defineModel<AuditLogDocument>('AuditLog', {
  adminId:  { type: 'string', required: true },
  action:   { type: 'string', required: true },
  entity:   { type: 'string', required: true },
  entityId: { type: 'string', required: true },
  metadata: { type: 'object' },
  ip:       { type: 'string', required: true },
});
