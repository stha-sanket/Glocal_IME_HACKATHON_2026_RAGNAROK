import { issueToken } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import { User } from '../../model/User.js';
import { Admin } from '../../model/Admin.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Refresh the JWT using the refresh-token cookie and issue a new access token.',
      response: { status: 200, body: { message: 'Token refreshed' } },
  },
};

const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export const POST = async (req: Request, res: Response) => {
  const token = req.cookies?.['efc_refresh_token'] || req.body?.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token required' });

  const user = await User.findOne({ refreshToken: token });
  const admin = user ? null : await Admin.findOne({ refreshToken: token });
  const account = user || admin;

  if (!account || !account.refreshTokenExpiry || new Date(account.refreshTokenExpiry) < new Date()) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const newRefreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  if (user) await User.update(user.id, { refreshToken: newRefreshToken, refreshTokenExpiry });
  else if (admin) await Admin.update(admin.id, { refreshToken: newRefreshToken, refreshTokenExpiry });

  res.cookie('efc_refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_TTL_MS,
  });

  await issueToken(res, { id: account.id, role: account.role, email: account.email });
  res.json({ message: 'Token refreshed' });
};
