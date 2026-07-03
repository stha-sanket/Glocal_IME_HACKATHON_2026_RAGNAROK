import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  DELETE: {
    description: 'Detach a payment method from the payment gateway.',
      request: { params: { id: 'pm_01HXZ' } },
      response: { status: 200, body: { message: 'Payment method pm_01HXZ removed' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: detach payment method from payment gateway
  res.json({ message: `Payment method ${id} removed` });
};
