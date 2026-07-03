import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  DELETE: {
    description: 'Delete a bookmark by ID.',
      request: { params: { id: 'bm_01HXZ' } },
      response: { status: 200, body: { message: 'Bookmark bm_01HXZ removed' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: delete bookmark
  res.json({ message: `Bookmark ${id} removed` });
};
