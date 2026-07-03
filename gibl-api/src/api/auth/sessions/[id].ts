import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  DELETE: {
    description: 'Revoke a single active session by ID.',
      request: { params: { id: 'sess_01HXZ' } },
      response: { status: 200, body: { message: 'Session sess_01HXZ revoked' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: revoke session by id
  res.json({ message: `Session ${id} revoked` });
};
