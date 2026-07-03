import { defineModel } from 'express-file-cluster';

export interface RoleDocument {
  name: string;
  description: string;
  permissions: string[];
}

export const Role = defineModel<RoleDocument>('Role', {
  name:        { type: 'string', required: true, unique: true },
  description: { type: 'string', required: true },
  permissions: { type: 'array',  default: [] },
});
