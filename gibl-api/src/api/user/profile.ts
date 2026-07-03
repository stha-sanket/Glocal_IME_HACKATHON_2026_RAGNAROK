import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { User } from '../../model/User.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: "Fetch the authenticated user's profile.",
    response: { status: 200, body: { user: { id: '1', role: 'user', email: 'user@example.com' } } },
  },
  PUT: {
    description: "Update the authenticated user's profile.",
    request: { body: { name: 'Jane Doe', email: 'jane@example.com' } },
    response: { status: 200, body: { message: 'Profile updated', user: { id: '1', role: 'user', email: 'jane@example.com' } } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const { id } = (req as any).user;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safe } = user;
  res.json({ user: safe });
};

export const PUT = async (req: Request, res: Response) => {
  const { id } = (req as any).user;
  const { name, email } = req.body;
  const updated = await User.update(id, { name, email });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safe } = updated;
  res.json({ message: 'Profile updated', user: safe });
};
