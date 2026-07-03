import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'List all faqs (admin only).',
      response: { status: 200, body: { faqs: [], total: 0 } },
  },
  POST: {
    description: 'Create a new faq (admin only).',
      request: { body: { question: 'sample-question', answer: 'sample-answer', category: 'sample-category' } },
      response: { status: 201, body: { message: 'FAQ created', faq: { id: 'new-id', question: 'sample-question' } } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (_req: Request, res: Response) => {
  // TODO: fetch faqs
  res.json({ faqs: [], total: 0 });
};

export const POST = async (req: Request, res: Response) => {
  const { question, answer, category } = req.body;
  // TODO: create FAQ
  res.status(201).json({ message: 'FAQ created', faq: { id: 'new-id', question } });
};
