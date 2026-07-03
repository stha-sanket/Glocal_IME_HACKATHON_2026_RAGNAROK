import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List favorites for the authenticated user.',
      response: { status: 200, body: { favorites: [] } },
  },
  POST: {
    description: 'Add an entity to the authenticated user\'s favorites.',
      request: { body: { entityId: 'post_01HXZ', entityType: 'post' } },
      response: { status: 201, body: { message: 'Added to favorites' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  // TODO: fetch user favorites
  res.json({ favorites: [] });
};

export const POST = async (req: Request, res: Response) => {
  const { entityId, entityType } = req.body;
  if (!entityId || !entityType) return res.status(400).json({ error: 'entityId and entityType are required' });
  // TODO: add to favorites
  res.status(201).json({ message: 'Added to favorites' });
};
