import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { User } from '../../model/User.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Admin dashboard stats. Requires admin role.',
    response: { status: 200, body: { stats: { totalUsers: 120, activeUsers: 98, verifiedUsers: 84 } } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (_req: Request, res: Response) => {
  const [totalUsers, activeUsers, verifiedUsers] = await Promise.all([
    User.count({}),
    User.count({ isActive: true }),
    User.count({ isVerified: true }),
  ]);
  res.json({ stats: { totalUsers, activeUsers, verifiedUsers } });
};
