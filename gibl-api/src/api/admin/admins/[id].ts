import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Fetch a single admin account by ID (admin only).',
      request: { params: { id: 'adm_01HXZ' } },
      response: { status: 200, body: { admin: { id: 'adm_01HXZ' } } },
  },
  PUT: {
    description: 'Update an admin account by ID (admin only).',
      request: { params: { id: 'adm_01HXZ' }, body: { name: 'Jane Doe', role: 'admin' } },
      response: { status: 200, body: { message: 'Admin updated', admin: { id: 'adm_01HXZ', name: 'Jane Doe', role: 'admin' } } },
  },
  DELETE: {
    description: 'Delete an admin account by ID (admin only).',
      request: { params: { id: 'adm_01HXZ' } },
      response: { status: 200, body: { message: 'Admin adm_01HXZ deleted' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: fetch admin by id
  res.json({ admin: { id } });
};

export const PUT = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: update admin record
  res.json({ message: 'Admin updated', admin: { id, ...req.body } });
};

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: delete admin
  res.json({ message: `Admin ${id} deleted` });
};
