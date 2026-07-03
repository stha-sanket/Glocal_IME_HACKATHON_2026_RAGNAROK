import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List all support tickets with filters (admin only).',
      request: { query: { status: 'open', priority: 'normal', page: '1', limit: '20' } },
      response: { status: 200, body: { tickets: [], total: 0, page: 1, limit: 20 } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const { status, priority, page = 1, limit = 20 } = req.query;
  // TODO: fetch all tickets with filters
  res.json({ tickets: [], total: 0, page: Number(page), limit: Number(limit) });
};
