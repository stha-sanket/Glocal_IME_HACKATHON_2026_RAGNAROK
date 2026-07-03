import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List bookmarks for the authenticated user.',
      response: { status: 200, body: { bookmarks: [] } },
  },
  POST: {
    description: 'Save a new bookmark for the authenticated user.',
      request: { body: { url: 'https://example.com', title: 'Example' } },
      response: { status: 201, body: { message: 'Bookmark saved' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  // TODO: fetch user bookmarks
  res.json({ bookmarks: [] });
};

export const POST = async (req: Request, res: Response) => {
  const { url, title } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });
  // TODO: save bookmark
  res.status(201).json({ message: 'Bookmark saved' });
};
