import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sendEmail } from '../services/email.service';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100, 'Name must be 100 characters or less.'),
  email: z.string().trim().email('Please enter a valid email address.').max(200, 'Email must be 200 characters or less.'),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters.').max(200, 'Subject must be 200 characters or less.'),
  message: z.string().trim().min(20, 'Message must be at least 20 characters.').max(5000, 'Message must be 5000 characters or less.'),
});

export default async function supportRoutes(server: FastifyInstance) {
  server.post('/contact', async (request, reply) => {
    try {
      const body = contactSchema.parse(request.body);
      const supportRecipient = (process.env.SUPPORT_EMAIL || 'support@thynkr.ca')
        .split(',')[0]
        .trim();

      await sendEmail({
        to: supportRecipient,
        subject: `[Contact] ${body.subject}`,
        replyTo: `${body.name} <${body.email}>`,
        html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6; 
        color: #374151;
        background: #f9fafb;
        padding: 20px;
      }
      .container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        overflow: hidden;
      }
      .header {
        background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
        padding: 24px;
        color: white;
      }
      .header h1 {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }
      .content {
        padding: 24px;
      }
      .field {
        margin-bottom: 20px;
      }
      .label {
        font-weight: 600;
        color: #111827;
        font-size: 14px;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #6b7280;
      }
      .value {
        color: #1f2937;
        font-size: 15px;
        padding: 8px 0;
      }
      .message-box {
        background: #f3f4f6;
        border-left: 4px solid #ec4899;
        padding: 16px;
        border-radius: 4px;
        margin-top: 8px;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      .footer {
        background: #f9fafb;
        padding: 16px 24px;
        border-top: 1px solid #e5e7eb;
        font-size: 12px;
        color: #6b7280;
        text-align: center;
      }
      .reply-link {
        color: #ec4899;
        text-decoration: none;
        font-weight: 500;
      }
      .reply-link:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📬 New Contact Form Submission</h1>
      </div>
      <div class="content">
        <div class="field">
          <div class="label">From</div>
          <div class="value">${body.name}</div>
        </div>
        <div class="field">
          <div class="label">Email</div>
          <div class="value"><a href="mailto:${body.email}" class="reply-link">${body.email}</a></div>
        </div>
        <div class="field">
          <div class="label">Subject</div>
          <div class="value">${body.subject}</div>
        </div>
        <div class="field">
          <div class="label">Message</div>
          <div class="message-box">${body.message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
      </div>
      <div class="footer">
        <p style="margin: 0;">Reply to this email to respond directly to ${body.name}</p>
      </div>
    </div>
  </body>
</html>
        `,
        text: `New Contact Form Submission\n\nFrom: ${body.name}\nEmail: ${body.email}\nSubject: ${body.subject}\n\nMessage:\n${body.message}\n\n---\nReply to this email to respond directly to ${body.name}`,
      });

      return reply.send({ success: true });
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        const firstIssue = error.issues?.[0];
        const field = firstIssue?.path?.[0] ?? 'form';
        const message = firstIssue?.message || 'Please check your contact details and message.';

        return reply.code(400).send({
          error: message,
          field,
          details: error.issues?.map((issue: any) => ({
            field: issue.path?.[0] ?? 'form',
            message: issue.message,
          })) ?? [],
        });
      }

      server.log.error({ error }, 'Failed to send contact support email');
      return reply.code(500).send({ error: 'Failed to send message. Please try again later.' });
    }
  });
}