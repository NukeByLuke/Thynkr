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
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${body.name}</p>
          <p><strong>Email:</strong> ${body.email}</p>
          <p><strong>Subject:</strong> ${body.subject}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p>${body.message.replace(/\n/g, '<br/>')}</p>
        `,
        text: `New Contact Form Submission\n\nName: ${body.name}\nEmail: ${body.email}\nSubject: ${body.subject}\n\nMessage:\n${body.message}`,
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