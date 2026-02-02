import { Helmet } from 'react-helmet-async';
import { Cookie } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import GradientText from '@/components/ui/GradientText';

export default function Cookies() {
  return (
    <>
      <Helmet>
        <title>Cookie Policy - Thynkr</title>
        <meta
          name="description"
          content="Learn about how Thynkr uses cookies and similar technologies to enhance your experience."
        />
      </Helmet>

      <PageContainer>
        <div className="py-12 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Cookie className="w-6 h-6 text-white" />
              </div>
              <GradientText as="h1" className="text-4xl md:text-5xl">
                Cookie Policy
              </GradientText>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Last updated: February 2, 2026
            </p>
          </div>

          {/* Content */}
          <Card padding="lg" variant="glass">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2>1. Introduction</h2>
              <p>
                This Cookie Policy explains how Thynkr ("we," "us," or "our") uses cookies and similar
                tracking technologies when you visit our website and use our AI-powered study platform
                (collectively, the "Service"). This policy should be read in conjunction with our{' '}
                <a
                  href="/legal/privacy"
                  className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </p>

              <h2>2. What Are Cookies?</h2>
              <p>
                Cookies are small text files that are placed on your device (computer, smartphone,
                tablet) when you visit a website. They are widely used to make websites work more
                efficiently and provide information to website owners.
              </p>
              <p>
                Cookies can be "persistent" (remaining on your device until they expire or you delete
                them) or "session" cookies (deleted when you close your browser).
              </p>

              <h2>3. Types of Cookies We Use</h2>
              
              <h3>3.1 Strictly Necessary Cookies</h3>
              <p>
                These cookies are essential for the Service to function properly. They enable core
                functionality such as security, authentication, and session management. The Service
                cannot function properly without these cookies.
              </p>
              <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-700">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">
                      Cookie Name
                    </th>
                    <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">
                      Purpose
                    </th>
                    <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      <code>auth_token</code>
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      Authentication and session management
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      7 days
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      <code>refresh_token</code>
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      Token refresh for maintaining session
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      30 days
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      <code>csrf_token</code>
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      Security protection against cross-site request forgery
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      Session
                    </td>
                  </tr>
                </tbody>
              </table>

              <h3>3.2 Functional Cookies</h3>
              <p>
                These cookies enable enhanced functionality and personalization. They may be set by us
                or by third-party providers whose services we have added to our pages.
              </p>
              <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-700">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">
                      Cookie Name
                    </th>
                    <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">
                      Purpose
                    </th>
                    <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      <code>theme_preference</code>
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      Remembers your light/dark mode preference
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      1 year
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      <code>language_preference</code>
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      Stores your preferred language for AI-generated content
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      1 year
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      <code>study_view_preferences</code>
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      Remembers your view preferences for study materials
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      90 days
                    </td>
                  </tr>
                </tbody>
              </table>

              <h3>3.3 Analytics Cookies</h3>
              <p>
                These cookies help us understand how visitors interact with our Service by collecting
                and reporting information anonymously. This helps us improve our Service and user
                experience.
              </p>
              <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-700">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">
                      Cookie Name
                    </th>
                    <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">
                      Purpose
                    </th>
                    <th className="border border-slate-300 dark:border-slate-700 px-4 py-2 text-left">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      <code>_ga</code>
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      Google Analytics - distinguishes unique users
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      2 years
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      <code>_gid</code>
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      Google Analytics - distinguishes users
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      24 hours
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      <code>_gat</code>
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      Google Analytics - throttles request rate
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 px-4 py-2">
                      1 minute
                    </td>
                  </tr>
                </tbody>
              </table>

              <h3>3.4 Performance Cookies</h3>
              <p>
                These cookies help us monitor and improve the performance of our Service. They collect
                information about page load times, error messages, and server response times.
              </p>

              <h2>4. Third-Party Cookies</h2>
              <p>
                Some cookies are placed by third-party services that appear on our pages. We do not
                control the placement of these cookies. The third parties we work with include:
              </p>
              <ul>
                <li>
                  <strong>Stripe:</strong> Payment processing and fraud prevention. See{' '}
                  <a
                    href="https://stripe.com/cookies-policy/legal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                  >
                    Stripe Cookie Policy
                  </a>
                  .
                </li>
                <li>
                  <strong>Google Analytics:</strong> Website analytics and performance monitoring. See{' '}
                  <a
                    href="https://policies.google.com/technologies/cookies"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                  >
                    Google Cookie Policy
                  </a>
                  .
                </li>
              </ul>

              <h2>5. Local Storage and Session Storage</h2>
              <p>
                In addition to cookies, we use browser local storage and session storage to enhance
                your experience:
              </p>
              <ul>
                <li>
                  <strong>Local Storage:</strong> Used to cache study materials, preferences, and UI
                  state for faster loading
                </li>
                <li>
                  <strong>Session Storage:</strong> Used for temporary data during your browsing
                  session, such as form data and navigation state
                </li>
              </ul>
              <p>
                Unlike cookies, this data is stored entirely on your device and is not transmitted to
                our servers unless you explicitly trigger an action that requires it.
              </p>

              <h2>6. How We Use Cookies</h2>
              <p>We use cookies for the following purposes:</p>
              <ul>
                <li>
                  <strong>Authentication:</strong> To recognize you when you log in and maintain your
                  session
                </li>
                <li>
                  <strong>Security:</strong> To protect your account and prevent fraudulent activity
                </li>
                <li>
                  <strong>Preferences:</strong> To remember your settings and preferences (theme,
                  language, etc.)
                </li>
                <li>
                  <strong>Analytics:</strong> To understand how users interact with our Service and
                  identify areas for improvement
                </li>
                <li>
                  <strong>Performance:</strong> To monitor Service performance and diagnose technical
                  issues
                </li>
                <li>
                  <strong>Payment Processing:</strong> To securely process payments through Stripe
                </li>
              </ul>

              <h2>7. Managing Your Cookie Preferences</h2>
              
              <h3>7.1 Browser Settings</h3>
              <p>
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul>
                <li>View which cookies are stored on your device</li>
                <li>Delete cookies individually or all at once</li>
                <li>Block third-party cookies</li>
                <li>Block all cookies (note: this may affect Service functionality)</li>
                <li>Set your browser to notify you when cookies are being sent</li>
              </ul>
              <p>
                For more information about managing cookies in your browser, please visit your
                browser's help pages:
              </p>
              <ul>
                <li>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                  >
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                  >
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                  >
                    Safari
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                  >
                    Microsoft Edge
                  </a>
                </li>
              </ul>

              <h3>7.2 Opting Out of Analytics</h3>
              <p>
                To opt out of Google Analytics tracking, you can install the{' '}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                >
                  Google Analytics Opt-out Browser Add-on
                </a>
                .
              </p>

              <h3>7.3 Impact of Disabling Cookies</h3>
              <p>
                If you disable or refuse cookies, please note that some parts of the Service may become
                inaccessible or not function properly. Specifically:
              </p>
              <ul>
                <li>You will not be able to stay logged in to your account</li>
                <li>Your preferences and settings will not be saved</li>
                <li>Some features may not work as expected</li>
                <li>You may experience degraded performance</li>
              </ul>

              <h2>8. Do Not Track Signals</h2>
              <p>
                Some browsers offer a "Do Not Track" (DNT) signal. Currently, there is no industry
                consensus on how to respond to DNT signals. At this time, our Service does not respond
                to DNT signals, but we will continue to monitor developments in this area.
              </p>

              <h2>9. Updates to This Cookie Policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices
                or for other operational, legal, or regulatory reasons. We will notify you of any
                material changes by posting the new Cookie Policy on this page and updating the "Last
                updated" date.
              </p>

              <h2>10. Contact Us</h2>
              <p>
                If you have any questions about our use of cookies or this Cookie Policy, please
                contact us:
              </p>
              <ul>
                <li>
                  Email:{' '}
                  <a
                    href="mailto:privacy@thynkr.ca"
                    className="text-sunrise-pink dark:text-midnight-cyan hover:underline"
                  >
                    privacy@thynkr.ca
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
                By continuing to use Thynkr, you consent to our use of cookies as described in this
                Cookie Policy. If you do not agree to our use of cookies, please adjust your browser
                settings or discontinue use of our Service.
              </p>
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
