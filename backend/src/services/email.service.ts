/**
 * Email Service
 * Handles sending emails via Resend API
 */

import { Resend } from 'resend';
import { config } from '../config';
import { logger } from '../lib/logger';

const resend = new Resend(config.resend.apiKey);

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!config.resend.enabled) {
    logger.info({ to: options.to, subject: options.subject }, 'Email sending disabled, skipping');
    return;
  }

  try {
    await resend.emails.send({
      from: config.resend.fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    logger.info({ to: options.to, subject: options.subject }, 'Email sent successfully');
  } catch (error: any) {
    logger.error({ error, to: options.to, subject: options.subject }, 'Failed to send email');
    throw new Error('Failed to send email');
  }
}

/**
 * Send email verification link
 */
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verifyUrl = `${config.app.frontendUrl}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify your Thynkr account',
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
              color: #1f2937;
              background: linear-gradient(135deg, #fdf2f8 0%, #fff7ed 100%);
              padding: 40px 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white;
              border-radius: 16px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #f472b6 0%, #fb923c 100%);
              padding: 32px;
              text-align: center;
            }
            .logo { 
              font-size: 36px; 
              font-weight: 900; 
              letter-spacing: 2px;
              color: white;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .content { 
              padding: 48px 40px;
            }
            h1 { 
              color: #111827; 
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 20px;
              line-height: 1.2;
            }
            p { 
              color: #4b5563; 
              font-size: 16px;
              margin-bottom: 24px;
              line-height: 1.7;
            }
            .button-wrapper {
              text-align: center;
              margin: 32px 0;
            }
            .button { 
              display: inline-block; 
              padding: 16px 40px; 
              background: linear-gradient(135deg, #f472b6 0%, #fb923c 100%);
              color: white !important; 
              text-decoration: none; 
              border-radius: 12px; 
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 10px 15px -3px rgba(244, 114, 182, 0.3), 0 4px 6px -2px rgba(244, 114, 182, 0.2);
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 20px 25px -5px rgba(244, 114, 182, 0.4), 0 10px 10px -5px rgba(244, 114, 182, 0.3);
            }
            .features {
              background: linear-gradient(135deg, #fdf2f8 0%, #fff7ed 100%);
              border-radius: 12px;
              padding: 24px;
              margin: 32px 0;
            }
            .feature {
              display: flex;
              align-items: start;
              gap: 12px;
              margin-bottom: 16px;
            }
            .feature:last-child {
              margin-bottom: 0;
            }
            .feature-icon {
              font-size: 24px;
              flex-shrink: 0;
            }
            .feature-text {
              color: #374151;
              font-size: 15px;
              margin: 0;
            }
            .link-section {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin: 32px 0;
            }
            .link-label {
              color: #6b7280;
              font-size: 13px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .link-url {
              color: #ec4899;
              font-size: 14px;
              word-break: break-all;
              text-decoration: none;
              font-family: 'Courier New', monospace;
            }
            .link-url:hover {
              color: #db2777;
              text-decoration: underline;
            }
            .note {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 8px;
              padding: 16px;
              margin-top: 32px;
            }
            .note p {
              color: #166534;
              font-size: 14px;
              margin: 0;
            }
            .footer { 
              background: #f9fafb;
              text-align: center; 
              padding: 32px 40px;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              color: #9ca3af; 
              font-size: 13px;
              margin: 0;
            }
            @media only screen and (max-width: 600px) {
              .content { padding: 32px 24px; }
              .header { padding: 24px; }
              .logo { font-size: 28px; }
              h1 { font-size: 24px; }
              .button { padding: 14px 32px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">THYNKR</div>
            </div>
            <div class="content">
              <h1>🎉 Welcome to Thynkr!</h1>
              <p>Thanks for signing up! You're one step away from unlocking AI-powered studying that adapts to your learning style.</p>
              
              <div class="button-wrapper">
                <a href="${verifyUrl}" class="button">Verify Email Address</a>
              </div>
              
              <div class="features">
                <div class="feature">
                  <div class="feature-icon">🤖</div>
                  <p class="feature-text"><strong>AI Tutoring:</strong> Get instant help with personalized explanations</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">📚</div>
                  <p class="feature-text"><strong>Smart Summaries:</strong> Turn any content into digestible study notes</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">✨</div>
                  <p class="feature-text"><strong>Interactive Quizzes:</strong> Test your knowledge and track progress</p>
                </div>
              </div>
              
              <div class="link-section">
                <div class="link-label">Or copy this link:</div>
                <a href="${verifyUrl}" class="link-url">${verifyUrl}</a>
              </div>
              
              <div class="note">
                <p>💡 <strong>Didn't create an account?</strong> You can safely ignore this email.</p>
              </div>
            </div>
            <div class="footer">
              <p>© 2026 Thynkr · AI-Powered Study Platform</p>
              <p style="margin-top: 8px;">This email was sent to ${email}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Thynkr!\n\nClick here to verify your email: ${verifyUrl}\n\nIf you didn't create an account, you can ignore this email.`,
  });
}

/**
 * Send password reset link
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${config.app.frontendUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your Thynkr password',
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
              color: #1f2937;
              background: linear-gradient(135deg, #fdf2f8 0%, #fff7ed 100%);
              padding: 40px 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white;
              border-radius: 16px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #f472b6 0%, #fb923c 100%);
              padding: 32px;
              text-align: center;
            }
            .logo { 
              font-size: 36px; 
              font-weight: 900; 
              letter-spacing: 2px;
              color: white;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .content { 
              padding: 48px 40px;
            }
            h1 { 
              color: #111827; 
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 20px;
              line-height: 1.2;
            }
            p { 
              color: #4b5563; 
              font-size: 16px;
              margin-bottom: 24px;
              line-height: 1.7;
            }
            .button-wrapper {
              text-align: center;
              margin: 32px 0;
            }
            .button { 
              display: inline-block; 
              padding: 16px 40px; 
              background: linear-gradient(135deg, #f472b6 0%, #fb923c 100%);
              color: white !important; 
              text-decoration: none; 
              border-radius: 12px; 
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 10px 15px -3px rgba(244, 114, 182, 0.3), 0 4px 6px -2px rgba(244, 114, 182, 0.2);
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 20px 25px -5px rgba(244, 114, 182, 0.4), 0 10px 10px -5px rgba(244, 114, 182, 0.3);
            }
            .warning { 
              background: linear-gradient(to right, #fef3c7, #fde68a);
              border-left: 4px solid #f59e0b; 
              padding: 20px;
              margin: 32px 0;
              border-radius: 8px;
              display: flex;
              align-items: flex-start;
              gap: 12px;
            }
            .warning-icon {
              font-size: 20px;
              flex-shrink: 0;
              line-height: 1.5;
            }
            .warning-text {
              color: #92400e;
              font-weight: 600;
              font-size: 15px;
              margin: 0;
              line-height: 1.5;
            }
            .link-section {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin: 32px 0;
            }
            .link-label {
              color: #6b7280;
              font-size: 13px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .link-url {
              color: #ec4899;
              font-size: 14px;
              word-break: break-all;
              text-decoration: none;
              font-family: 'Courier New', monospace;
            }
            .link-url:hover {
              color: #db2777;
              text-decoration: underline;
            }
            .security-note {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 8px;
              padding: 20px;
              margin-top: 32px;
            }
            .security-note strong {
              color: #15803d;
              display: block;
              margin-bottom: 8px;
              font-size: 15px;
            }
            .security-note p {
              color: #166534;
              font-size: 14px;
              margin: 0;
            }
            .footer { 
              background: #f9fafb;
              text-align: center; 
              padding: 32px 40px;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              color: #9ca3af; 
              font-size: 13px;
              margin: 0;
            }
            @media only screen and (max-width: 600px) {
              .content { padding: 32px 24px; }
              .header { padding: 24px; }
              .logo { font-size: 28px; }
              h1 { font-size: 24px; }
              .button { padding: 14px 32px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">THYNKR</div>
            </div>
            <div class="content">
              <h1>🔐 Password Reset Request</h1>
              <p>We received a request to reset your Thynkr account password. Click the button below to create a new password and regain access to your account.</p>
              
              <div class="button-wrapper">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </div>
              
              <div class="warning">
                <div class="warning-icon">⏱️</div>
                <p class="warning-text">This secure link expires in 1 hour for your protection</p>
              </div>
              
              <div class="link-section">
                <div class="link-label">Or copy this link:</div>
                <a href="${resetUrl}" class="link-url">${resetUrl}</a>
              </div>
              
              <div class="security-note">
                <strong>🛡️ Didn't request this?</strong>
                <p>No worries! You can safely ignore this email. Your password will remain unchanged and your account is secure.</p>
              </div>
            </div>
            <div class="footer">
              <p>© 2026 Thynkr · AI-Powered Study Platform</p>
              <p style="margin-top: 8px;">This email was sent to ${email}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Password Reset Request\n\nClick here to reset your password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can ignore this email.`,
  });
}
