import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List all plans (admin only).',
      response: { status: 200, body: { plans: [], total: 0 } },
  },
  POST: {
    description: 'Create a new plan (admin only).',
      request: { body: { name: 'sample-name', price: 'sample-price', interval: 'sample-interval' } },
      response: { status: 201, body: { message: 'Plan created', plan: { id: 'new-id', name: 'sample-name' } } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (_req: Request, res: Response) => {
  // TODO: fetch plans
  res.json({ plans: [], total: 0 });
};

export const POST = async (req: Request, res: Response) => {
  const { name, price, interval } = req.body;
  // TODO: create Plan
  res.status(201).json({ message: 'Plan created', plan: { id: 'new-id', name } });
};
