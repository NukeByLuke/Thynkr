import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from './Logo';
import { useTheme } from '@/contexts/ThemeContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        mt-auto transition-all duration-500 ease-in-out backdrop-blur-xl
        ${
          theme === 'dark'
            ? 'bg-slate-900/80 border-t border-white/10'
            : 'bg-white/70 border-t border-white/20'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Desktop Layout */}
        <div className="hidden md:flex justify-between items-center py-4">
          {/* Left: Logo + Tagline */}
          <div className="flex items-center gap-3">
            <Logo variant="icon" animated={false} />
            <div>
              <p
                className={`text-sm font-semibold transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
              >
                Thynkr
              </p>
              <p
                className={`text-xs transition-colors duration-500 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                AI-powered learning for everyone.
              </p>
            </div>
          </div>

          {/* Center: Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className={`
                text-sm transition-all duration-300 ease-out relative group
                ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-brand-400'
                    : 'text-gray-600 hover:text-brand-600'
                }
              `}
            >
              Privacy
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-500 to-accent-500 group-hover:w-full transition-all duration-300 ease-out" />
            </Link>
            <Link
              to="/terms"
              className={`
                text-sm transition-all duration-300 ease-out relative group
                ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-brand-400'
                    : 'text-gray-600 hover:text-brand-600'
                }
              `}
            >
              Terms
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-500 to-accent-500 group-hover:w-full transition-all duration-300 ease-out" />
            </Link>
            <a
              href="mailto:contact@thynkr.ca"
              className={`
                text-sm transition-all duration-300 ease-out relative group
                ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-brand-400'
                    : 'text-gray-600 hover:text-brand-600'
                }
              `}
            >
              Contact
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-500 to-accent-500 group-hover:w-full transition-all duration-300 ease-out" />
            </a>
          </div>

          {/* Right: Copyright */}
          <div
            className={`text-sm transition-colors duration-500 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            © {currentYear} Thynkr.
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col items-center gap-2 h-20 py-3 px-4 text-center">
          {/* Logo + Tagline */}
          <div className="flex items-center gap-2">
            <Logo variant="icon" animated={false} />
            <div>
              <p
                className={`text-sm font-semibold transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
              >
                Thynkr
              </p>
              <p
                className={`text-xs transition-colors duration-500 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                AI-powered learning
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="inline-flex flex-wrap justify-center gap-3 text-xs">
            <Link
              to="/privacy"
              className={`transition-all duration-300 ease-out ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-brand-400'
                  : 'text-gray-600 hover:text-brand-600'
              }`}
            >
              Privacy
            </Link>
            <span
              className={`transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              }`}
            >
              •
            </span>
            <Link
              to="/terms"
              className={`transition-all duration-300 ease-out ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-brand-400'
                  : 'text-gray-600 hover:text-brand-600'
              }`}
            >
              Terms
            </Link>
            <span
              className={`transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              }`}
            >
              •
            </span>
            <a
              href="mailto:contact@thynkr.ca"
              className={`transition-all duration-300 ease-out ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-brand-400'
                  : 'text-gray-600 hover:text-brand-600'
              }`}
            >
              Contact
            </a>
            <span
              className={`transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              }`}
            >
              •
            </span>
            <span
              className={`transition-colors duration-500 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              © {currentYear}
            </span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
