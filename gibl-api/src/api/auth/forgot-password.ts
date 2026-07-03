import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import { enqueue } from 'express-file-cluster/tasks';
import { User } from '../../model/User.js';
import { Admin } from '../../model/Admin.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Send a password reset email to the given address.',
      request: { body: { email: 'user@example.com' } },
      response: { status: 200, body: { message: 'Reset email sent' } },
  },
};

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

export const POST = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const user = await User.findOne({ email });
  const admin = user ? null : await Admin.findOne({ email });

  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  if (user || admin) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    if (user) await User.update(user.id, { resetToken, resetTokenExpiry });
    else if (admin) await Admin.update(admin.id, { resetToken, resetTokenExpiry });
    var appUrl = process.env.APP_URL || 'http://localhost:3000';
    await enqueue('SendEmail', {
      to: email,
      subject: 'Reset your password',
      body: 'Reset your password: ' + appUrl + '/auth/reset-password?token=' + resetToken,
    });
  }

  res.json({ message: 'Reset email sent' });
};
