import { Helmet } from 'react-helmet-async';
import { HelpCircle, Mail, LifeBuoy, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';

export default function HelpCenter() {
  return (
    <>
      <Helmet>
        <title>Help Center - Thynkr</title>
        <meta
          name="description"
          content="Get help with your Thynkr account, billing, and study tools."
        />
      </Helmet>

      <PageContainer>
        <div className="max-w-5xl mx-auto py-4 sm:py-6 md:py-10 space-y-5 sm:space-y-6">
          <div className="text-center mb-1 sm:mb-2">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 shadow-lg mb-3 sm:mb-4">
              <HelpCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Help Center</h1>
            <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Quick links for support, billing, and account help.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            <Card variant="glass" padding="md" className="border border-slate-200/80 dark:border-white/10">
              <div className="flex items-start gap-3">
                <LifeBuoy className="w-5 h-5 text-cyan-500 mt-0.5" />
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Contact Support</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Reach out to our team for account or platform issues.
                  </p>
                  <Link
                    to="/contact"
                    className="mt-3 inline-flex min-h-[40px] items-center text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    Go to contact page
                  </Link>
                </div>
              </div>
            </Card>

            <Card variant="glass" padding="md" className="border border-slate-200/80 dark:border-white/10">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-violet-500 mt-0.5" />
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Billing & Plans</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Manage subscription details and plan options.
                  </p>
                  <Link
                    to="/settings"
                    className="mt-3 inline-flex min-h-[40px] items-center text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Open billing settings
                  </Link>
                </div>
              </div>
            </Card>

            <Card variant="glass" padding="md" className="border border-slate-200/80 dark:border-white/10">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Email Us</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    For urgent help, email us directly and include screenshots.
                  </p>
                  <a
                    href="mailto:support@thynkr.ca"
                    className="mt-3 inline-flex min-h-[40px] items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline break-all"
                  >
                    support@thynkr.ca
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
