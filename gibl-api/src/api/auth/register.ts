import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { enqueue } from 'express-file-cluster/tasks';
import { User } from '../../model/User.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Register a new user account.',
    request: { body: { name: 'Jane Doe', email: 'jane@example.com', password: 'secret' } },
    response: { status: 201, body: { message: 'Account created successfully' } },
  },
};

export const POST = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already in use' });
  const hashed = await bcrypt.hash(password, 10);
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const user = await User.create({ name, email, password: hashed, verifyToken });

  var appUrl = process.env.APP_URL || 'http://localhost:3000';
  await enqueue('SendEmail', {
    to: email,
    subject: 'Verify your email address',
    body: 'Welcome, ' + name + '! Verify your email: ' + appUrl + '/auth/verify-email?token=' + verifyToken,
  });

  const { password: _, verifyToken: __, ...safe } = user;
  res.status(201).json({ message: 'Account created successfully', user: safe });
};
