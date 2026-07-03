import { defineModel } from 'express-file-cluster';

export interface NotificationDocument {
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
}

export const Notification = defineModel<NotificationDocument>('Notification', {
  userId:  { type: 'string',  required: true },
  title:   { type: 'string',  required: true },
  message: { type: 'string',  required: true },
  type:    { type: 'string',  required: true, default: 'info' },
  isRead:  { type: 'boolean', default: false },
  link:    { type: 'string' },
});
