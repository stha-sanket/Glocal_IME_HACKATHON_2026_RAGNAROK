import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Revenue analytics: MRR, ARR, payment history (admin only).',
      request: { query: { period: '30d' } },
      response: { status: 200, body: { mrr: 0, arr: 0, history: [], period: '30d' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const { period = '30d' } = req.query;
  // TODO: fetch revenue analytics for period
  res.json({ mrr: 0, arr: 0, history: [], period });
};
