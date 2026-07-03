import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Paginated audit log entries (admin only).',
      request: { query: { page: '1', limit: '50' } },
      response: { status: 200, body: { logs: [], total: 0, page: 1, limit: 50 } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const { page = 1, limit = 50 } = req.query;
  // TODO: fetch audit logs with pagination
  res.json({ logs: [], total: 0, page: Number(page), limit: Number(limit) });
};
