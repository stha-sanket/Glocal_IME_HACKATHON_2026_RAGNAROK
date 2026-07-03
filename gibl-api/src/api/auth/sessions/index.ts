import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List all active sessions for the authenticated user.',
      response: { status: 200, body: { sessions: [] } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  // TODO: fetch sessions for req.user.id
  res.json({ sessions: [] });
};
