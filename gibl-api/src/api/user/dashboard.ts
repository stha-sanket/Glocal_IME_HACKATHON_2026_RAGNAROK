import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Personal dashboard: stats, recent activity, and quick actions.',
      response: { status: 200, body: { stats: {}, recentActivity: [], quickActions: [] } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  // TODO: aggregate personal stats and activity
  res.json({ stats: {}, recentActivity: [], quickActions: [] });
};
