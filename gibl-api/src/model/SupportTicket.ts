import { defineModel } from 'express-file-cluster';

export interface SupportTicketDocument {
  userId: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  assignedTo?: string;
}

export const SupportTicket = defineModel<SupportTicketDocument>('SupportTicket', {
  userId:     { type: 'string', required: true },
  subject:    { type: 'string', required: true },
  message:    { type: 'string', required: true },
  status:     { type: 'string', required: true, default: 'open' },
  priority:   { type: 'string', required: true, default: 'normal' },
  assignedTo: { type: 'string' },
});
