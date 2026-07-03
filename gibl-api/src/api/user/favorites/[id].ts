import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  DELETE: {
    description: 'Remove an entity from the authenticated user favorites.',
      request: { params: { id: 'fav_01HXZ' } },
      response: { status: 200, body: { message: 'Removed favorite fav_01HXZ' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: remove from favorites
  res.json({ message: `Removed favorite ${id}` });
};
