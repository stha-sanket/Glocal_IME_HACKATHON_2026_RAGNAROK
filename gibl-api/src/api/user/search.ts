import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Search with filters, sort, and pagination.',
      request: { query: { q: 'query', filter: 'active', sort: 'newest', page: '1', limit: '20' } },
      response: { status: 200, body: { results: [], total: 0, page: 1, limit: 20 } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const { q, filter, sort, page = 1, limit = 20 } = req.query;
  // TODO: implement search
  res.json({ results: [], total: 0, page: Number(page), limit: Number(limit) });
};
