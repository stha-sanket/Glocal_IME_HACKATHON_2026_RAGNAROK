import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List all roles (admin only).',
      response: { status: 200, body: { roles: [] } },
  },
  POST: {
    description: 'Create a new role (admin only).',
      request: { body: { name: 'editor', description: 'Can edit content', permissions: ['content:write'] } },
      response: { status: 201, body: { message: 'Role created', role: { id: 'new-id', name: 'editor', permissions: ['content:write'] } } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (_req: Request, res: Response) => {
  // TODO: fetch all roles
  res.json({ roles: [] });
};

export const POST = async (req: Request, res: Response) => {
  const { name, description, permissions } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  // TODO: create role
  res.status(201).json({ message: 'Role created', role: { id: 'new-id', name, permissions: permissions ?? [] } });
};
