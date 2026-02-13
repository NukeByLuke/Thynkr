import { Helmet } from 'react-helmet-async';
import { Shield } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Thynkr</title>
        <meta
          name="description"
          content="Learn how Thynkr collects, uses, and protects your personal information and study data."
        />
      </Helmet>

      <PageContainer>
        <div className="py-12 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 dark:from-blue-400 dark:via-cyan-400 dark:to-blue-400">
                Privacy Policy
              </span>
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400">
              Last updated: February 2, 2026
            </p>
          </div>

          {/* Content */}
          <Card padding="lg" variant="glass">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2>1. Introduction</h2>
              <p>
                Welcome to Thynkr ("we," "our," or "us"). We are committed to protecting your
                privacy and ensuring the security of your personal information. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your information when you use
                our AI-powered study platform.
              </p>

              <h2>2. Information We Collect</h2>
              
              <h3>2.1 Personal Information</h3>
              <p>We collect information that you provide directly to us, including:</p>
              <ul>
                <li>Name and email address (for account creation)</li>
                <li>Password (encrypted and hashed)</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Profile information and preferences</li>
              </ul>

              <h3>2.2 Study Content and Materials</h3>
              <p>When you use our platform, we collect and process:</p>
              <ul>
                <li>Uploaded study files (PDFs, documents, images)</li>
                <li>YouTube video URLs you submit for processing</li>
                <li>AI-generated summaries, notes, flashcards, and quizzes</li>
                <li>Your study session history and progress data</li>
                <li>Course materials you create or access</li>
              </ul>

              <h3>2.3 Usage Information</h3>
              <p>We automatically collect certain information about your device and usage:</p>
              <ul>
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>IP address and geographic location</li>
                <li>Pages visited and features used</li>
                <li>Time and date of visits</li>
                <li>Referring website addresses</li>
              </ul>

              <h2>3. How We Use Your Information</h2>
              <p>We use the collected information for the following purposes:</p>
              <ul>
                <li>
                  <strong>Service Delivery:</strong> To provide, maintain, and improve our AI-powered
                  study tools and features
                </li>
                <li>
                  <strong>AI Processing:</strong> To generate summaries, notes, flashcards, and
                  quizzes using Google Gemini AI and OpenAI services
                </li>
                <li>
                  <strong>Text-to-Speech:</strong> To convert your study materials into audio using
                  OpenAI's TTS technology
                </li>
                <li>
                  <strong>Payment Processing:</strong> To process subscription payments through Stripe
                </li>
                <li>
                  <strong>Account Management:</strong> To create and manage your user account
                </li>
                <li>
                  <strong>Communication:</strong> To send you service updates, technical notices, and
                  support messages
                </li>
                <li>
                  <strong>Analytics:</strong> To understand how users interact with our platform and
                  improve user experience
                </li>
                <li>
                  <strong>Security:</strong> To detect and prevent fraud, abuse, and security incidents
                </li>
              </ul>

              <h2>4. AI Data Processing</h2>
              
              <h3>4.1 Google Gemini AI</h3>
              <p>
                We use Google's Gemini 2.5 Flash Lite AI model to process your study materials and
                generate educational content. Your uploaded files and text are sent to Google's
                servers for processing. Google processes this data according to their privacy policy
                and terms of service. We recommend reviewing{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                >
                  Google's Privacy Policy
                </a>
                .
              </p>

              <h3>4.2 OpenAI Services</h3>
              <p>
                We use OpenAI's text-to-speech (TTS) technology to convert your study materials into
                audio. Text content is sent to OpenAI's servers for processing. OpenAI processes this
                data according to their privacy policy. We recommend reviewing{' '}
                <a
                  href="https://openai.com/policies/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                >
                  OpenAI's Privacy Policy
                </a>
                .
              </p>

              <h3>4.3 Data Retention in AI Processing</h3>
              <p>
                Third-party AI providers may temporarily retain your data for processing purposes. We
                do not have control over the retention policies of these third-party services. Your
                study materials processed through AI services are subject to the respective provider's
                data retention policies.
              </p>

              <h2>5. Payment Processing</h2>
              <p>
                All payment transactions are processed by Stripe, Inc. We do not store your complete
                credit card information on our servers. Stripe collects and processes your payment
                information according to their privacy policy. We recommend reviewing{' '}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                >
                  Stripe's Privacy Policy
                </a>
                .
              </p>

              <h2>6. Data Storage and Security</h2>
              <p>
                We implement industry-standard security measures to protect your data:
              </p>
              <ul>
                <li>Encryption of data in transit using SSL/TLS</li>
                <li>Secure password hashing using bcrypt</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Secure cloud storage with DigitalOcean</li>
              </ul>
              <p>
                However, no method of transmission over the internet or electronic storage is 100%
                secure. While we strive to protect your personal information, we cannot guarantee its
                absolute security.
              </p>

              <h2>7. Data Sharing and Disclosure</h2>
              <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
              <ul>
                <li>
                  <strong>Service Providers:</strong> With third-party vendors who perform services on
                  our behalf (Google Gemini AI, OpenAI, Stripe, DigitalOcean)
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or to respond to legal
                  process
                </li>
                <li>
                  <strong>Safety and Protection:</strong> To protect the rights, property, or safety of
                  Thynkr, our users, or others
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a merger, acquisition, or
                  sale of assets
                </li>
              </ul>

              <h2>8. Your Rights and Choices</h2>
              <p>You have the following rights regarding your personal information:</p>
              <ul>
                <li>
                  <strong>Access:</strong> Request access to the personal information we hold about you
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate or incomplete data
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your account and associated data
                </li>
                <li>
                  <strong>Data Portability:</strong> Request a copy of your data in a portable format
                </li>
                <li>
                  <strong>Opt-Out:</strong> Unsubscribe from marketing communications
                </li>
              </ul>
              <p>
                To exercise these rights, please contact us at{' '}
                <a
                  href="mailto:support@thynkr.study"
                  className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                >
                  support@thynkr.study
                </a>
                .
              </p>

              <h2>9. Children's Privacy</h2>
              <p>
                Thynkr is not intended for users under the age of 13. We do not knowingly collect
                personal information from children under 13. If you are a parent or guardian and
                believe your child has provided us with personal information, please contact us, and
                we will delete such information.
              </p>

              <h2>10. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your
                country of residence. These countries may have data protection laws that are different
                from the laws of your country. By using Thynkr, you consent to the transfer of your
                information to Canada and other countries where we operate.
              </p>

              <h2>11. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to enhance your experience on our
                platform. For detailed information, please review our{' '}
                <a
                  href="/legal/cookies"
                  className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                >
                  Cookie Policy
                </a>
                .
              </p>

              <h2>12. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes
                by posting the new Privacy Policy on this page and updating the "Last updated" date.
                You are advised to review this Privacy Policy periodically for any changes.
              </p>

              <h2>13. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our privacy practices, please
                contact us:
              </p>
              <ul>
                <li>
                  Email:{' '}
                  <a
                    href="mailto:support@thynkr.study"
                    className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                  >
                    support@thynkr.study
                  </a>
                </li>
                <li>
                  Website:{' '}
                  <a
                    href="https://thynkr.study"
                    className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                  >
                    https://thynkr.study
                  </a>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
