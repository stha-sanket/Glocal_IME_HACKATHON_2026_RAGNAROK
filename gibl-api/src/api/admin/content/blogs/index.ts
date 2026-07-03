import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List all blogs (admin only).',
      response: { status: 200, body: { blogs: [], total: 0 } },
  },
  POST: {
    description: 'Create a new blog (admin only).',
      request: { body: { title: 'sample-title', slug: 'sample-slug', content: 'sample-content' } },
      response: { status: 201, body: { message: 'Blog created', blog: { id: 'new-id', title: 'sample-title' } } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (_req: Request, res: Response) => {
  // TODO: fetch blogs
  res.json({ blogs: [], total: 0 });
};

export const POST = async (req: Request, res: Response) => {
  const { title, slug, content } = req.body;
  // TODO: create Blog
  res.status(201).json({ message: 'Blog created', blog: { id: 'new-id', title } });
};
