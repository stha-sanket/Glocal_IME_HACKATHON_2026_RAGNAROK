import { issueToken } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { User } from '../../model/User.js';
import { Admin } from '../../model/Admin.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Authenticate a user or admin and issue a JWT.',
    request: { body: { email: 'user@example.com', password: 'user' } },
    response: { status: 200, body: { message: 'Logged in as user' } },
  },
};

const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

async function issueRefreshToken(
  res: Response,
  model: { update: (id: string, data: Record<string, unknown>) => Promise<unknown> },
  id: string,
): Promise<void> {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  await model.update(id, { refreshToken, refreshTokenExpiry: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) });
  res.cookie('efc_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

export const POST = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const admin = await Admin.findOne({ email });
  if (admin) {
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    if (!admin.isActive) return res.status(403).json({ error: 'Account suspended' });
    await issueToken(res, { id: admin.id, role: admin.role, email: admin.email });
    await issueRefreshToken(res, Admin, admin.id);
    return res.json({ message: 'Logged in as admin' });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.isActive) return res.status(403).json({ error: 'Account suspended' });
  await issueToken(res, { id: user.id, role: user.role, email: user.email });
  await issueRefreshToken(res, User, user.id);
  res.json({ message: 'Logged in' });
};
