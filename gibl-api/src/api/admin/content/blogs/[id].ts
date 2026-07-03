import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Fetch a single blog by ID (admin only).',
      request: { params: { id: 'blog_01HXZ' } },
      response: { status: 200, body: { blog: { id: 'blog_01HXZ', title: 'sample-title', slug: 'sample-slug', content: 'sample-content' } } },
  },
  PUT: {
    description: 'Update a blog by ID (admin only).',
      request: { params: { id: 'blog_01HXZ' }, body: { title: 'sample-title', slug: 'sample-slug', content: 'sample-content' } },
      response: { status: 200, body: { message: 'Blog updated', blog: { id: 'blog_01HXZ', title: 'sample-title', slug: 'sample-slug', content: 'sample-content' } } },
  },
  DELETE: {
    description: 'Delete a blog by ID (admin only).',
      request: { params: { id: 'blog_01HXZ' } },
      response: { status: 200, body: { message: 'Blog blog_01HXZ deleted' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: fetch Blog by id
  res.json({ blog: { id } });
};

export const PUT = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: update Blog
  res.json({ message: 'Blog updated', blog: { id, ...req.body } });
};

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: delete Blog
  res.json({ message: `Blog ${id} deleted` });
};
