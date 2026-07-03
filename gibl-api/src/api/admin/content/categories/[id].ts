import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Fetch a single category by ID (admin only).',
      request: { params: { id: 'category_01HXZ' } },
      response: { status: 200, body: { category: { id: 'category_01HXZ', name: 'sample-name', slug: 'sample-slug' } } },
  },
  PUT: {
    description: 'Update a category by ID (admin only).',
      request: { params: { id: 'category_01HXZ' }, body: { name: 'sample-name', slug: 'sample-slug' } },
      response: { status: 200, body: { message: 'Category updated', category: { id: 'category_01HXZ', name: 'sample-name', slug: 'sample-slug' } } },
  },
  DELETE: {
    description: 'Delete a category by ID (admin only).',
      request: { params: { id: 'category_01HXZ' } },
      response: { status: 200, body: { message: 'Category category_01HXZ deleted' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: fetch Category by id
  res.json({ category: { id } });
};

export const PUT = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: update Category
  res.json({ message: 'Category updated', category: { id, ...req.body } });
};

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: delete Category
  res.json({ message: `Category ${id} deleted` });
};
