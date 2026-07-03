import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List all sent notifications (admin only).',
      response: { status: 200, body: { notifications: [], total: 0 } },
  },
  POST: {
    description: 'Send a notification to a specific user (admin only).',
      request: { body: { userId: 'usr_01HXZ', title: 'Welcome', message: 'Thanks for joining!', type: 'info' } },
      response: { status: 201, body: { message: 'Notification sent' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (_req: Request, res: Response) => {
  // TODO: fetch sent notifications
  res.json({ notifications: [], total: 0 });
};

export const POST = async (req: Request, res: Response) => {
  const { userId, title, message, type } = req.body;
  if (!userId || !title || !message) return res.status(400).json({ error: 'userId, title and message are required' });
  // TODO: create and send notification to user
  res.status(201).json({ message: 'Notification sent' });
};
