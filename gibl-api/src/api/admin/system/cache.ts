import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  DELETE: {
    description: 'Flush the application cache (admin only).',
      response: { status: 200, body: { message: 'Cache cleared' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const DELETE = async (_req: Request, res: Response) => {
  // TODO: flush Redis or in-memory cache
  res.json({ message: 'Cache cleared' });
};
