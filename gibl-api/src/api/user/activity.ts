import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Paginated activity history for the authenticated user.',
      request: { query: { page: '1', limit: '20' } },
      response: { status: 200, body: { activities: [], total: 0, page: 1, limit: 20 } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  // TODO: fetch paginated activity log
  res.json({ activities: [], total: 0, page: Number(page), limit: Number(limit) });
};
