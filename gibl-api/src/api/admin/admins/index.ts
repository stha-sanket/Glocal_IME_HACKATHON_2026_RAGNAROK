import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List all admin accounts (admin only).',
      response: { status: 200, body: { admins: [], total: 0 } },
  },
  POST: {
    description: 'Create a new admin account (admin only).',
      request: { body: { name: 'Jane Doe', email: 'jane@example.com', role: 'admin' } },
      response: { status: 201, body: { message: 'Admin created', admin: { id: 'new-id', name: 'Jane Doe', email: 'jane@example.com', role: 'admin' } } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (_req: Request, res: Response) => {
  // TODO: fetch admins from DB
  res.json({ admins: [], total: 0 });
};

export const POST = async (req: Request, res: Response) => {
  const { name, email, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' });
  // TODO: create admin account
  res.status(201).json({ message: 'Admin created', admin: { id: 'new-id', name, email, role: role ?? 'admin' } });
};
