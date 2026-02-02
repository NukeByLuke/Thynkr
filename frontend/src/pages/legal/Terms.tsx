import { Helmet } from 'react-helmet-async';
import { Scale } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import GradientText from '@/components/ui/GradientText';

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service - Thynkr</title>
        <meta
          name="description"
          content="Read the Terms of Service for using Thynkr's AI-powered study platform."
        />
      </Helmet>

      <PageContainer maxWidth="4xl">
        <div className="py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <GradientText as="h1" className="text-4xl md:text-5xl">
                Terms of Service
              </GradientText>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Last updated: February 2, 2026
            </p>
          </div>

          {/* Content */}
          <Card padding="lg" variant="glass">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2>1. Acceptance of Terms</h2>
              <p>
                Welcome to Thynkr. By accessing or using our AI-powered study platform ("Service"),
                you agree to be bound by these Terms of Service ("Terms"). If you do not agree to
                these Terms, please do not use our Service.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you and Thynkr ("we," "us,"
                or "our"). By creating an account or using our Service, you represent that you are at
                least 13 years of age and have the legal capacity to enter into these Terms.
              </p>

              <h2>2. Description of Service</h2>
              <p>
                Thynkr is an AI-powered learning platform that provides the following features:
              </p>
              <ul>
                <li>AI-generated summaries, notes, flashcards, and quizzes from your study materials</li>
                <li>Text-to-speech audio generation for study content</li>
                <li>YouTube video processing and transcription (paid plans)</li>
                <li>File upload and organization tools</li>
                <li>Private and public course creation and sharing (paid plans)</li>
                <li>AI Tutor conversations (Premium plan)</li>
                <li>Study progress tracking and analytics</li>
              </ul>
              <p>
                We reserve the right to modify, suspend, or discontinue any aspect of the Service at
                any time, with or without notice.
              </p>

              <h2>3. Account Registration and Security</h2>
              
              <h3>3.1 Account Creation</h3>
              <p>
                To use certain features of the Service, you must create an account. You agree to:
              </p>
              <ul>
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>

              <h3>3.2 Account Termination</h3>
              <p>
                We reserve the right to suspend or terminate your account at any time, with or without
                cause or notice, if we believe you have violated these Terms or engaged in fraudulent
                or illegal activities.
              </p>

              <h2>4. Subscription Plans and Billing</h2>
              
              <h3>4.1 Plan Tiers</h3>
              <p>Thynkr offers three subscription tiers:</p>
              <ul>
                <li>
                  <strong>Basic (Free):</strong> Limited AI requests (50/month), file uploads (10/month),
                  and text-to-speech features
                </li>
                <li>
                  <strong>Standard ($4.99/month):</strong> 900% more AI requests (500/month), file uploads
                  (100/month), YouTube video processing, private courses, and enhanced TTS limits
                </li>
                <li>
                  <strong>Premium ($9.99/month):</strong> Unlimited AI requests, file uploads, YouTube
                  processing, TTS, AI Tutor, public course publishing, and priority support
                </li>
              </ul>

              <h3>4.2 Payment Processing</h3>
              <p>
                All payments are processed securely through Stripe, Inc. By subscribing to a paid
                plan, you authorize us to charge your payment method on a recurring basis according to
                your chosen billing cycle (monthly or yearly).
              </p>

              <h3>4.3 Billing and Renewals</h3>
              <p>
                Subscriptions automatically renew at the end of each billing period unless you cancel
                before the renewal date. You will be charged the then-current rate for your plan upon
                renewal. Price changes will be communicated at least 30 days in advance.
              </p>

              <h3>4.4 Refunds and Cancellations</h3>
              <p>
                You may cancel your subscription at any time through your account settings. Cancellations
                take effect at the end of the current billing period. We do not provide refunds for
                partial subscription periods, except as required by law.
              </p>

              <h3>4.5 Usage Limits</h3>
              <p>
                Each plan has specific usage limits for AI requests, file uploads, and other features.
                If you exceed your plan's limits, you may be required to upgrade to continue using
                certain features. Usage resets monthly based on your subscription start date.
              </p>

              <h2>5. AI Services and Third-Party Providers</h2>
              
              <h3>5.1 AI Processing Disclaimers</h3>
              <p>
                Thynkr uses artificial intelligence services provided by Google (Gemini AI) and OpenAI
                to generate study materials and audio content. You acknowledge and agree that:
              </p>
              <ul>
                <li>AI-generated content may contain errors, inaccuracies, or inconsistencies</li>
                <li>
                  AI outputs should be reviewed and verified before relying on them for important
                  decisions
                </li>
                <li>
                  We do not guarantee the accuracy, completeness, or reliability of AI-generated
                  content
                </li>
                <li>
                  AI services may be temporarily unavailable due to technical issues or maintenance
                </li>
                <li>
                  Your content is processed by third-party AI providers according to their terms and
                  policies
                </li>
              </ul>

              <h3>5.2 Third-Party Services</h3>
              <p>
                Our Service integrates with the following third-party providers:
              </p>
              <ul>
                <li>
                  <strong>Google Gemini AI:</strong> For content generation and analysis
                </li>
                <li>
                  <strong>OpenAI:</strong> For text-to-speech conversion
                </li>
                <li>
                  <strong>Stripe:</strong> For payment processing
                </li>
                <li>
                  <strong>DigitalOcean:</strong> For hosting and infrastructure
                </li>
              </ul>
              <p>
                Your use of these third-party services through Thynkr is subject to their respective
                terms of service and privacy policies. We are not responsible for the actions or
                policies of these third-party providers.
              </p>

              <h2>6. User Content and Intellectual Property</h2>
              
              <h3>6.1 Your Content</h3>
              <p>
                You retain all rights to the content you upload to Thynkr ("Your Content"). By
                uploading content, you grant us a non-exclusive, worldwide, royalty-free license to
                use, store, process, and display Your Content solely for the purpose of providing the
                Service to you.
              </p>

              <h3>6.2 AI-Generated Content</h3>
              <p>
                Content generated by our AI services (summaries, notes, flashcards, quizzes, audio)
                based on Your Content is considered derivative work. You have the right to use this
                AI-generated content for your personal educational purposes.
              </p>

              <h3>6.3 Public Courses</h3>
              <p>
                If you publish courses publicly (Premium plan feature), you grant other Thynkr users
                the right to access and use your published course materials. You represent and warrant
                that you have the necessary rights to publish such content.
              </p>

              <h3>6.4 Our Intellectual Property</h3>
              <p>
                The Thynkr platform, including its design, features, functionality, and underlying
                technology, is owned by us and protected by copyright, trademark, and other
                intellectual property laws. You may not copy, modify, distribute, or reverse engineer
                any part of the Service without our express written permission.
              </p>

              <h2>7. Acceptable Use Policy</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Upload content that infringes on others' intellectual property rights</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Use automated tools to scrape or extract data from the Service</li>
                <li>Share your account credentials with others</li>
                <li>
                  Abuse or exploit the AI services for purposes other than personal educational use
                </li>
                <li>Upload sexually explicit, violent, or hateful content</li>
                <li>Impersonate others or misrepresent your affiliation with any person or entity</li>
                <li>
                  Interfere with or disrupt the Service or servers connected to the Service
                </li>
              </ul>
              <p>
                Violation of this Acceptable Use Policy may result in immediate suspension or
                termination of your account.
              </p>

              <h2>8. Copyright and DMCA</h2>
              <p>
                We respect intellectual property rights and expect our users to do the same. If you
                believe that content on Thynkr infringes your copyright, please contact us at{' '}
                <a
                  href="mailto:dmca@thynkr.ca"
                  className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                >
                  dmca@thynkr.ca
                </a>{' '}
                with the following information:
              </p>
              <ul>
                <li>Identification of the copyrighted work claimed to be infringed</li>
                <li>Location of the allegedly infringing material</li>
                <li>Your contact information</li>
                <li>A statement of good faith belief that use is not authorized</li>
                <li>A statement of accuracy under penalty of perjury</li>
                <li>Your physical or electronic signature</li>
              </ul>

              <h2>9. Disclaimers and Limitations of Liability</h2>
              
              <h3>9.1 Service "As Is"</h3>
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
                EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>

              <h3>9.2 Educational Use Only</h3>
              <p>
                Thynkr is designed for educational and learning purposes. AI-generated content should
                not be relied upon as professional advice, medical information, legal guidance, or
                financial recommendations.
              </p>

              <h3>9.3 Limitation of Liability</h3>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, THYNKR SHALL NOT BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO
                LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, ARISING FROM:
              </p>
              <ul>
                <li>Your use or inability to use the Service</li>
                <li>Unauthorized access to or alteration of your content</li>
                <li>Errors or inaccuracies in AI-generated content</li>
                <li>Third-party conduct or content on the Service</li>
                <li>Any other matter relating to the Service</li>
              </ul>

              <h3>9.4 Maximum Liability</h3>
              <p>
                Our total liability to you for all claims arising from your use of the Service shall
                not exceed the amount you paid us in the twelve (12) months preceding the claim.
              </p>

              <h2>10. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Thynkr and its officers, directors,
                employees, and agents from any claims, liabilities, damages, losses, and expenses
                (including legal fees) arising from:
              </p>
              <ul>
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Your Content uploaded to the Service</li>
              </ul>

              <h2>11. Governing Law and Dispute Resolution</h2>
              <p>
                These Terms are governed by the laws of Canada and the Province of Ontario, without
                regard to conflict of law principles. Any disputes arising from these Terms or your use
                of the Service shall be resolved through binding arbitration in accordance with the
                rules of the Arbitration Act (Ontario).
              </p>

              <h2>12. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of
                material changes by email or through a prominent notice on the Service. Your continued
                use of the Service after changes become effective constitutes acceptance of the
                modified Terms.
              </p>

              <h2>13. Severability</h2>
              <p>
                If any provision of these Terms is found to be invalid or unenforceable, that provision
                shall be limited or eliminated to the minimum extent necessary, and the remaining
                provisions shall remain in full force and effect.
              </p>

              <h2>14. Entire Agreement</h2>
              <p>
                These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire
                agreement between you and Thynkr regarding the Service and supersede all prior
                agreements and understandings.
              </p>

              <h2>15. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us:
              </p>
              <ul>
                <li>
                  Email:{' '}
                  <a
                    href="mailto:legal@thynkr.ca"
                    className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                  >
                    legal@thynkr.ca
                  </a>
                </li>
                <li>
                  Website:{' '}
                  <a
                    href="https://thynkr.ca"
                    className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                  >
                    https://thynkr.ca
                  </a>
                </li>
              </ul>

              <hr className="my-8" />

              <p className="text-sm text-slate-600 dark:text-slate-400">
                By using Thynkr, you acknowledge that you have read, understood, and agree to be bound
                by these Terms of Service. If you do not agree to these Terms, you must discontinue use
                of the Service immediately.
              </p>
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
