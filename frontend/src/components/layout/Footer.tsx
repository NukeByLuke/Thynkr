import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-white dark:bg-[#1E293B] border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Centered Logo + Tagline */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo variant="icon" animated={false} />
            <img
              src="/brand/wordmark-light.png"
              alt="THYNKR"
              className="h-4 object-contain dark:hidden"
            />
            <img
              src="/brand/wordmark-dark.png"
              alt="THYNKR"
              className="h-4 object-contain hidden dark:block"
            />
          </div>
          <p className="text-sm text-[#6B7280] dark:text-gray-400">
            AI-powered learning for everyone.
          </p>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="text-sm text-[#6B7280] dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-[#6B7280] dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/roadmap"
              className="text-sm text-[#6B7280] dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Roadmap
            </Link>
            <a
              href="mailto:support@thynkr.study"
              className="text-sm text-[#6B7280] dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-[#6B7280] dark:text-gray-400">
            © {currentYear} THYNKR
          </p>
        </div>
      </div>
    </footer>
  );
}
