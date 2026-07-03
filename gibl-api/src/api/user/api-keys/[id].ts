import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  DELETE: {
    description: 'Revoke and delete an API key by ID.',
      request: { params: { id: 'key_01HXZ' } },
      response: { status: 200, body: { message: 'API key key_01HXZ revoked' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: revoke and delete API key
  res.json({ message: `API key ${id} revoked` });
};
