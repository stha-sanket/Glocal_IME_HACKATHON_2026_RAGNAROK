import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Fetch a single coupon by ID (admin only).',
      request: { params: { id: 'coupon_01HXZ' } },
      response: { status: 200, body: { coupon: { id: 'coupon_01HXZ', code: 'sample-code', type: 'sample-type', value: 'sample-value' } } },
  },
  PUT: {
    description: 'Update a coupon by ID (admin only).',
      request: { params: { id: 'coupon_01HXZ' }, body: { code: 'sample-code', type: 'sample-type', value: 'sample-value' } },
      response: { status: 200, body: { message: 'Coupon updated', coupon: { id: 'coupon_01HXZ', code: 'sample-code', type: 'sample-type', value: 'sample-value' } } },
  },
  DELETE: {
    description: 'Delete a coupon by ID (admin only).',
      request: { params: { id: 'coupon_01HXZ' } },
      response: { status: 200, body: { message: 'Coupon coupon_01HXZ deleted' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: fetch Coupon by id
  res.json({ coupon: { id } });
};

export const PUT = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: update Coupon
  res.json({ message: 'Coupon updated', coupon: { id, ...req.body } });
};

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: delete Coupon
  res.json({ message: `Coupon ${id} deleted` });
};
