import { defineModel } from 'express-file-cluster';

export interface AdminDocument {
  name: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  resetToken?: string;
  resetTokenExpiry?: Date;
  refreshToken?: string;
  refreshTokenExpiry?: Date;
}

export const Admin = defineModel<AdminDocument>('Admin', {
  name:               { type: 'string',  required: true },
  email:              { type: 'string',  required: true, unique: true },
  password:           { type: 'string',  required: true },
  role:               { type: 'string',  required: true, default: 'admin' },
  permissions:        { type: 'array',   default: [] },
  isActive:           { type: 'boolean', default: true },
  resetToken:         { type: 'string' },
  resetTokenExpiry:   { type: 'date' },
  refreshToken:       { type: 'string' },
  refreshTokenExpiry: { type: 'date' },
});
