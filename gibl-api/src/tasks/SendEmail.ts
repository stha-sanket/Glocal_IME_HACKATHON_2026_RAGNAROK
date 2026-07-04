import { defineTask } from "express-file-cluster/tasks";
import nodemailer from "nodemailer";

interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
}

let transporter: nodemailer.Transporter;

export default defineTask<SendEmailPayload>(async (payload) => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      // port: Number(process.env.SMTP_PORT ?? 587),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: payload.to,
    subject: payload.subject,
    html: payload.body,
  });
});
