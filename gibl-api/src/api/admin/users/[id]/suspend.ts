import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Suspend a user account (admin only).',
      request: { params: { id: 'usr_01HXZ' }, body: { reason: 'Terms of service violation' } },
      response: { status: 200, body: { message: 'User usr_01HXZ suspended', reason: 'Terms of service violation' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const POST = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  // TODO: set user.isActive = false, log audit event
  res.json({ message: `User ${id} suspended`, reason });
};
