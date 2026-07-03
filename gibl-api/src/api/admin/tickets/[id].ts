import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Fetch a single support ticket by ID (admin only).',
      request: { params: { id: 'tk_01HXZ' } },
      response: { status: 200, body: { ticket: { id: 'tk_01HXZ' } } },
  },
  PUT: {
    description: 'Assign, reply to, or change the status of a support ticket (admin only).',
      request: { params: { id: 'tk_01HXZ' }, body: { reply: 'Looking into it.', status: 'in_progress', assignedTo: 'adm_01HXZ' } },
      response: { status: 200, body: { message: 'Ticket updated', ticket: { id: 'tk_01HXZ', status: 'in_progress', assignedTo: 'adm_01HXZ' } } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: fetch ticket by id
  res.json({ ticket: { id } });
};

export const PUT = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reply, status, assignedTo } = req.body;
  // TODO: update ticket (assign, change status, add reply)
  res.json({ message: 'Ticket updated', ticket: { id, status, assignedTo } });
};
