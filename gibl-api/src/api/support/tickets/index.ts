import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List the authenticated user\'s own support tickets.',
      response: { status: 200, body: { tickets: [], total: 0 } },
  },
  POST: {
    description: 'Create a new support ticket.',
      request: { body: { subject: 'Issue with login', message: 'I cannot log in', priority: 'normal' } },
      response: { status: 201, body: { message: 'Ticket created', ticket: { id: 'new-id', subject: 'Issue with login', status: 'open' } } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  // TODO: fetch tickets for current user
  res.json({ tickets: [], total: 0 });
};

export const POST = async (req: Request, res: Response) => {
  const { subject, message, priority } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'subject and message are required' });
  // TODO: create support ticket in DB
  res.status(201).json({ message: 'Ticket created', ticket: { id: 'new-id', subject, status: 'open' } });
};
