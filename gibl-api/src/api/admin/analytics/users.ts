import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'User analytics: registrations, active users, churn (admin only).',
      request: { query: { period: '30d' } },
      response: { status: 200, body: { registrations: [], activeUsers: 0, churn: 0, period: '30d' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const { period = '30d' } = req.query;
  // TODO: fetch user analytics for period
  res.json({ registrations: [], activeUsers: 0, churn: 0, period });
};
