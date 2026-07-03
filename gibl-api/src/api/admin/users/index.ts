import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../../../model/User.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List all users, paginated (admin only).',
    request: { query: { page: '1', limit: '20' } },
    response: { status: 200, body: { users: [], total: 0, page: 1, limit: 20 } },
  },
  POST: {
    description: 'Create a new user account (admin only).',
    request: { body: { name: 'Jane Doe', email: 'jane@example.com', password: 'secret', role: 'user' } },
    response: { status: 201, body: { message: 'User created', user: { id: 'new-id', name: 'Jane Doe', email: 'jane@example.com', role: 'user' } } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const [all, total] = await Promise.all([User.find({}), User.count({})]);
  const users = all.slice((page - 1) * limit, page * limit).map(({ password: _, ...u }) => u);
  res.json({ users, total, page, limit });
};

export const POST = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already in use' });
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role: role ?? 'user' });
  const { password: _, ...safe } = user;
  res.status(201).json({ message: 'User created', user: safe });
};
