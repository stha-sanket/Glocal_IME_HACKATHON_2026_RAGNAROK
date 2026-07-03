import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Fetch a single plan by ID (admin only).',
      request: { params: { id: 'plan_01HXZ' } },
      response: { status: 200, body: { plan: { id: 'plan_01HXZ', name: 'sample-name', price: 'sample-price', interval: 'sample-interval' } } },
  },
  PUT: {
    description: 'Update a plan by ID (admin only).',
      request: { params: { id: 'plan_01HXZ' }, body: { name: 'sample-name', price: 'sample-price', interval: 'sample-interval' } },
      response: { status: 200, body: { message: 'Plan updated', plan: { id: 'plan_01HXZ', name: 'sample-name', price: 'sample-price', interval: 'sample-interval' } } },
  },
  DELETE: {
    description: 'Delete a plan by ID (admin only).',
      request: { params: { id: 'plan_01HXZ' } },
      response: { status: 200, body: { message: 'Plan plan_01HXZ deleted' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: fetch Plan by id
  res.json({ plan: { id } });
};

export const PUT = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: update Plan
  res.json({ message: 'Plan updated', plan: { id, ...req.body } });
};

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: delete Plan
  res.json({ message: `Plan ${id} deleted` });
};
