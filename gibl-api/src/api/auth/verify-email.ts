import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import { enqueue } from 'express-file-cluster/tasks';
import { User } from '../../model/User.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Verify an email address using the token from the verification link.',
      request: { query: { token: 'a1b2c3d4' } },
      response: { status: 200, body: { message: 'Email verified' } },
  },
  POST: {
    description: 'Resend the verification email to a given address.',
      request: { body: { email: 'user@example.com' } },
      response: { status: 200, body: { message: 'Verification email sent' } },
  },
};

export const GET = async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'token is required' });

  const user = await User.findOne({ verifyToken: token });
  if (!user) return res.status(400).json({ error: 'Invalid or expired verification token' });

  await User.update(user.id, { isVerified: true, verifyToken: '' });
  res.json({ message: 'Email verified' });
};

export const POST = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const user = await User.findOne({ email });
  if (user && !user.isVerified) {
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await User.update(user.id, { verifyToken });
    var appUrl = process.env.APP_URL || 'http://localhost:3000';
    await enqueue('SendEmail', {
      to: email,
      subject: 'Verify your email address',
      body: 'Verify your email: ' + appUrl + '/auth/verify-email?token=' + verifyToken,
    });
  }

  res.json({ message: 'Verification email sent' });
};
