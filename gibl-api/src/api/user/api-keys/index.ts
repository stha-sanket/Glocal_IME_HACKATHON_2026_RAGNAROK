import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List API keys for the authenticated user.',
      response: { status: 200, body: { apiKeys: [] } },
  },
  POST: {
    description: 'Generate a new API key for the authenticated user.',
      request: { body: { name: 'CI key' } },
      response: { status: 201, body: { message: 'API key created', key: 'efc_...' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  // TODO: fetch api keys for user
  res.json({ apiKeys: [] });
};

export const POST = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  // TODO: generate and store API key
  res.status(201).json({ message: 'API key created', key: 'efc_...' });
};
