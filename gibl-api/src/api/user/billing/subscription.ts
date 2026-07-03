import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Get the current subscription for the authenticated user.',
      response: { status: 200, body: { subscription: null } },
  },
  POST: {
    description: 'Subscribe the authenticated user to a plan.',
      request: { body: { planId: 'plan_01HXZ' } },
      response: { status: 201, body: { message: 'Subscribed', subscription: { planId: 'plan_01HXZ' } } },
  },
  DELETE: {
    description: 'Cancel the current subscription at period end.',
      response: { status: 200, body: { message: 'Subscription cancelled' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  // TODO: fetch current subscription for user
  res.json({ subscription: null });
};

export const POST = async (req: Request, res: Response) => {
  const { planId } = req.body;
  if (!planId) return res.status(400).json({ error: 'planId is required' });
  // TODO: create subscription via payment gateway
  res.status(201).json({ message: 'Subscribed', subscription: { planId } });
};

export const DELETE = async (req: Request, res: Response) => {
  // TODO: cancel subscription at period end
  res.json({ message: 'Subscription cancelled' });
};
