import { defineModel } from 'express-file-cluster';

export interface UserDocument {
  name: string;
  email: string;
  password: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  verifyToken?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  refreshToken?: string;
  refreshTokenExpiry?: Date;
  accountNumber?: string;
  balance: number;
  isCardBlocked: boolean;
}

export const User = defineModel<UserDocument>('User', {
  name:               { type: 'string',  required: true },
  email:              { type: 'string',  required: true, unique: true },
  password:           { type: 'string',  required: true },
  role:               { type: 'string',  required: true, default: 'user' },
  avatar:             { type: 'string' },
  isVerified:         { type: 'boolean', default: false },
  isActive:           { type: 'boolean', default: true },
  verifyToken:        { type: 'string' },
  resetToken:         { type: 'string' },
  resetTokenExpiry:   { type: 'date' },
  refreshToken:       { type: 'string' },
  refreshTokenExpiry: { type: 'date' },
  accountNumber:      { type: 'string', unique: true },
  balance:            { type: 'number', default: 0 },
  isCardBlocked:      { type: 'boolean', default: false },
});
