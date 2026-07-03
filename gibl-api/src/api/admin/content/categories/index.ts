import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List all categories (admin only).',
      response: { status: 200, body: { categories: [], total: 0 } },
  },
  POST: {
    description: 'Create a new category (admin only).',
      request: { body: { name: 'sample-name', slug: 'sample-slug' } },
      response: { status: 201, body: { message: 'Category created', category: { id: 'new-id', name: 'sample-name' } } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (_req: Request, res: Response) => {
  // TODO: fetch categories
  res.json({ categories: [], total: 0 });
};

export const POST = async (req: Request, res: Response) => {
  const { name, slug } = req.body;
  // TODO: create Category
  res.status(201).json({ message: 'Category created', category: { id: 'new-id', name } });
};
