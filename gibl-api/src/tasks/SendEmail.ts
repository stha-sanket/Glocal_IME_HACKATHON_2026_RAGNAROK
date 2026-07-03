import { defineTask } from 'express-file-cluster/tasks';

interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
}

export default defineTask<SendEmailPayload>(async (payload) => {
  // TODO: wire up your mailer
  console.log('[SendEmail] Sending to', payload.to);
});
