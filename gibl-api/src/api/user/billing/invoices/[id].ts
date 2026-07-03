import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Get the download URL for a single invoice by ID.',
      request: { params: { id: 'inv_01HXZ' } },
      response: { status: 200, body: { invoice: { id: 'inv_01HXZ', downloadUrl: 'https://example.com/invoices/inv_01HXZ.pdf' } } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: return invoice PDF URL or inline data
  res.json({ invoice: { id, downloadUrl: 'https://...' } });
};
