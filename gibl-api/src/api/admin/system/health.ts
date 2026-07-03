import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'System health check: DB, queue, cache status (admin only).',
      response: { status: 200, body: { status: 'ok', db: 'ok', queue: 'ok', uptime: 12345 } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (_req: Request, res: Response) => {
  // TODO: check DB connection, queue, cache health
  res.json({ status: 'ok', db: 'ok', queue: 'ok', uptime: process.uptime() });
};
