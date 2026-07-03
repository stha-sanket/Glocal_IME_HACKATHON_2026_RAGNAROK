import { defineTask } from 'express-file-cluster/tasks';
import nodemailer from 'nodemailer';

interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default defineTask<SendEmailPayload>(async (payload) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: payload.to,
    subject: payload.subject,
    html: payload.body,
  });
});
