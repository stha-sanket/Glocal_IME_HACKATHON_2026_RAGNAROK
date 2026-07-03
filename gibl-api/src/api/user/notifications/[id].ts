import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Fetch a single notification by ID.',
      request: { params: { id: 'notif_01HXZ' } },
      response: { status: 200, body: { notification: { id: 'notif_01HXZ' } } },
  },
  PATCH: {
    description: 'Mark a single notification as read.',
      request: { params: { id: 'notif_01HXZ' } },
      response: { status: 200, body: { message: 'Notification marked as read', id: 'notif_01HXZ' } },
  },
  DELETE: {
    description: 'Delete a single notification.',
      request: { params: { id: 'notif_01HXZ' } },
      response: { status: 200, body: { message: 'Notification notif_01HXZ deleted' } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: fetch notification by id
  res.json({ notification: { id } });
};

export const PATCH = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: mark notification as read
  res.json({ message: 'Notification marked as read', id });
};

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: delete notification
  res.json({ message: `Notification ${id} deleted` });
};
