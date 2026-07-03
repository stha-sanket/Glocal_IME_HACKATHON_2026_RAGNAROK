import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Traffic analytics: page views, devices, countries (admin only).',
      request: { query: { period: '30d' } },
      response: { status: 200, body: { pageViews: 0, devices: {}, countries: {}, period: '30d' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const { period = '30d' } = req.query;
  // TODO: fetch traffic analytics for period
  res.json({ pageViews: 0, devices: {}, countries: {}, period });
};
