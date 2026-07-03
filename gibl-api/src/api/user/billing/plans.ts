import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List all available subscription plans.',
      response: { status: 200, body: { plans: [] } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (_req: Request, res: Response) => {
  // TODO: fetch active plans from DB
  res.json({ plans: [] });
};
