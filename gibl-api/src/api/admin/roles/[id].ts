import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Fetch a single role by ID (admin only).',
      request: { params: { id: 'role_01HXZ' } },
      response: { status: 200, body: { role: { id: 'role_01HXZ', name: 'editor', permissions: ['content:write'] } } },
  },
  PUT: {
    description: 'Update a role by ID (admin only).',
      request: { params: { id: 'role_01HXZ' }, body: { name: 'editor', permissions: ['content:write'] } },
      response: { status: 200, body: { message: 'Role updated', role: { id: 'role_01HXZ', name: 'editor', permissions: ['content:write'] } } },
  },
  DELETE: {
    description: 'Delete a role by ID (admin only).',
      request: { params: { id: 'role_01HXZ' } },
      response: { status: 200, body: { message: 'Role role_01HXZ deleted' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: fetch role by id
  res.json({ role: { id } });
};

export const PUT = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: update role
  res.json({ message: 'Role updated', role: { id, ...req.body } });
};

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: delete role
  res.json({ message: `Role ${id} deleted` });
};
