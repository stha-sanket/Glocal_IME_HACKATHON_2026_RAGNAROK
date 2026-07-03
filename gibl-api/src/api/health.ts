import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Health check — returns server status and current timestamp.',
    response: { status: 200, body: { status: 'OK', timestamp: '2024-01-01T00:00:00.000Z' } },
  },
};

export const GET = async (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
};
