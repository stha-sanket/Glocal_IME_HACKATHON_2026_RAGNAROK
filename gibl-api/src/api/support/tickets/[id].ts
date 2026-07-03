import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Fetch a single support ticket by ID.',
      request: { params: { id: 'tk_01HXZ' } },
      response: { status: 200, body: { ticket: { id: 'tk_01HXZ', subject: 'Issue', status: 'open', replies: [] } } },
  },
  PUT: {
    description: 'Add a reply to a support ticket or update its status.',
      request: { params: { id: 'tk_01HXZ' }, body: { reply: 'Thanks, resolved.', status: 'closed' } },
      response: { status: 200, body: { message: 'Ticket updated', ticket: { id: 'tk_01HXZ', status: 'closed' } } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: fetch ticket by id, verify ownership
  res.json({ ticket: { id, subject: '', status: 'open', replies: [] } });
};

export const PUT = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reply, status } = req.body;
  // TODO: add reply or update status
  res.json({ message: 'Ticket updated', ticket: { id, status: status ?? 'open' } });
};
