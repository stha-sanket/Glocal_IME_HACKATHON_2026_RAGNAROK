import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Return the currently authenticated user.',
    response: { status: 200, body: { user: { id: '1', role: 'user', email: 'user@example.com' } } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
};
