import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { User } from '../../../model/User.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Fetch a single user by ID (admin only).',
    request: { params: { id: 'usr_01HXZ' } },
    response: { status: 200, body: { user: { id: 'usr_01HXZ', name: 'Jane Doe', email: 'jane@example.com', role: 'user' } } },
  },
  PUT: {
    description: 'Update a user by ID (admin only).',
    request: { params: { id: 'usr_01HXZ' }, body: { name: 'Jane Doe', email: 'jane@example.com', role: 'user', isActive: true } },
    response: { status: 200, body: { message: 'User updated', user: { id: 'usr_01HXZ', name: 'Jane Doe', email: 'jane@example.com', role: 'user' } } },
  },
  DELETE: {
    description: 'Delete a user by ID (admin only).',
    request: { params: { id: 'usr_01HXZ' } },
    response: { status: 200, body: { message: 'User usr_01HXZ deleted' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safe } = user;
  res.json({ user: safe });
};

export const PUT = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role, isActive } = req.body;
  const updated = await User.update(id, { name, email, role, isActive });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safe } = updated;
  res.json({ message: 'User updated', user: safe });
};

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await User.delete(id);
  res.json({ message: `User ${id} deleted` });
};
