import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List all coupons (admin only).',
      response: { status: 200, body: { coupons: [], total: 0 } },
  },
  POST: {
    description: 'Create a new coupon (admin only).',
      request: { body: { code: 'sample-code', type: 'sample-type', value: 'sample-value' } },
      response: { status: 201, body: { message: 'Coupon created', coupon: { id: 'new-id', code: 'sample-code' } } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (_req: Request, res: Response) => {
  // TODO: fetch coupons
  res.json({ coupons: [], total: 0 });
};

export const POST = async (req: Request, res: Response) => {
  const { code, type, value } = req.body;
  // TODO: create Coupon
  res.status(201).json({ message: 'Coupon created', coupon: { id: 'new-id', code } });
};
