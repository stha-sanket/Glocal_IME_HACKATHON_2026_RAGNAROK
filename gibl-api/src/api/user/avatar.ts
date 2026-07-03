import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Upload a new avatar image for the authenticated user.',
      response: { status: 200, body: { message: 'Avatar updated', url: 'https://example.com/avatar.jpg' } },
  },
  DELETE: {
    description: 'Remove the authenticated user\'s avatar.',
      response: { status: 200, body: { message: 'Avatar removed' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const POST = async (req: Request, res: Response) => {
  // TODO: handle multipart upload, store file, update user.avatar
  res.json({ message: 'Avatar updated', url: 'https://example.com/avatar.jpg' });
};

export const DELETE = async (req: Request, res: Response) => {
  // TODO: remove avatar and clear user.avatar
  res.json({ message: 'Avatar removed' });
};
