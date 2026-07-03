import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Download a personal data export for the authenticated user.',
      response: { status: 200, body: { data: { user: { id: '1', role: 'user', email: 'user@example.com' }, exportedAt: '2026-01-01T00:00:00.000Z' } } },
  },
  DELETE: {
    description: 'Schedule the authenticated account for deletion (requires password confirmation).',
      request: { body: { password: 'current' } },
      response: { status: 200, body: { message: 'Account scheduled for deletion' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  // TODO: compile and return personal data export
  res.json({ data: { user: (req as any).user, exportedAt: new Date().toISOString() } });
};

export const DELETE = async (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'password confirmation required' });
  // TODO: verify password, schedule account deletion
  res.json({ message: 'Account scheduled for deletion' });
};
