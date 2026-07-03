import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List notifications for the authenticated user.',
      response: { status: 200, body: { notifications: [], total: 0, unread: 0 } },
  },
  POST: {
    description: 'Mark all notifications as read for the authenticated user.',
      response: { status: 200, body: { message: 'All notifications marked as read' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  // TODO: fetch notifications for user
  res.json({ notifications: [], total: 0, unread: 0 });
};

export const POST = async (req: Request, res: Response) => {
  // TODO: mark all notifications as read
  res.json({ message: 'All notifications marked as read' });
};
