import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List payment methods for the authenticated user.',
      response: { status: 200, body: { paymentMethods: [] } },
  },
  POST: {
    description: 'Attach a new payment method via the payment gateway.',
      request: { body: { token: 'tok_...' } },
      response: { status: 201, body: { message: 'Payment method added' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  // TODO: fetch payment methods for user
  res.json({ paymentMethods: [] });
};

export const POST = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'payment token is required' });
  // TODO: attach payment method via payment gateway
  res.status(201).json({ message: 'Payment method added' });
};
