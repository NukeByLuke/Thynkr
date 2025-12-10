import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from './Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mt-auto backdrop-blur-xl border-t bg-white/70 dark:bg-slate-900/70 border-slate-200/50 dark:border-slate-700/50 theme-transition"
    >
      <div className="max-w-6xl mx-auto px-8 lg:px-16">
        {/* Desktop Layout */}
        <div className="hidden md:flex justify-between items-center py-4">
          {/* Left: Logo + Tagline */}
          <div className="flex items-center gap-3">
            <Logo variant="icon" animated={false} />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white theme-transition">
                Thynkr
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 theme-transition">
                AI-powered learning for everyone.
              </p>
            </div>
          </div>

          {/* Center: Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-300 ease-out relative group"
            >
              Privacy
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] group-hover:w-full transition-all duration-300 ease-out" />
            </Link>
            <Link
              to="/terms"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-300 ease-out relative group"
            >
              Terms
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] group-hover:w-full transition-all duration-300 ease-out" />
            </Link>
            <a
              href="mailto:contact@thynkr.ca"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-300 ease-out relative group"
            >
              Contact
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] group-hover:w-full transition-all duration-300 ease-out" />
            </a>
          </div>

          {/* Right: Copyright */}
          <div className="text-sm text-slate-600 dark:text-slate-400 theme-transition">
            © {currentYear} Thynkr.
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col items-center gap-2 h-20 py-3 px-4 text-center">
          {/* Logo + Tagline */}
          <div className="flex items-center gap-2">
            <Logo variant="icon" animated={false} />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white theme-transition">
                Thynkr
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 theme-transition">
                AI-powered learning
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="inline-flex flex-wrap justify-center gap-3 text-xs">
            <Link
              to="/privacy"
              className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-300 ease-out"
            >
              Privacy
            </Link>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <Link
              to="/terms"
              className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-300 ease-out"
            >
              Terms
            </Link>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <a
              href="mailto:contact@thynkr.ca"
              className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-300 ease-out"
            >
              Contact
            </a>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-slate-600 dark:text-slate-400">
              © {currentYear}
            </span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
