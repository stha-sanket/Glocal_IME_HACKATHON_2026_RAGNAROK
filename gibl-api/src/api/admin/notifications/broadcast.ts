import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Broadcast a notification to all users (admin only).',
      request: { body: { title: 'Announcement', message: 'Hello everyone!', type: 'info' } },
      response: { status: 200, body: { message: 'Broadcast sent', count: 0 } },
  },
};

export const middlewares = [requireAuth('admin')];

export const POST = async (req: Request, res: Response) => {
  const { title, message, type } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'title and message are required' });
  // TODO: send notification to all users
  res.json({ message: 'Broadcast sent', count: 0 });
};
