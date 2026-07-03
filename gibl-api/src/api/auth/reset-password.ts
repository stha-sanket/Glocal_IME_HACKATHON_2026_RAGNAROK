import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../../model/User.js';
import { Admin } from '../../model/Admin.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Reset password using a valid reset token.',
      request: { body: { token: 'reset-token', password: 'newpassword' } },
      response: { status: 200, body: { message: 'Password reset successfully' } },
  },
};

export const POST = async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'token and password are required' });

  const user = await User.findOne({ resetToken: token });
  const admin = user ? null : await Admin.findOne({ resetToken: token });
  const account = user || admin;

  if (!account || !account.resetTokenExpiry || new Date(account.resetTokenExpiry) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const hashed = await bcrypt.hash(password, 10);
  if (user) await User.update(user.id, { password: hashed, resetToken: '' });
  else if (admin) await Admin.update(admin.id, { password: hashed, resetToken: '' });

  res.json({ message: 'Password reset successfully' });
};
