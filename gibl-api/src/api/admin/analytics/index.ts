import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Analytics overview: users, revenue, traffic (admin only).',
      response: { status: 200, body: { users: {}, revenue: {}, traffic: {} } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  // TODO: aggregate analytics overview
  res.json({ users: {}, revenue: {}, traffic: {} });
};
