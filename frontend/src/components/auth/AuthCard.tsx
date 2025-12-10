/**
 * AuthCard - Wrapper component for authentication forms
 * White background, rounded-2xl, shadow-md, animated fade-in
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="w-full bg-white rounded-2xl shadow-md p-10"
    >
      {(title || subtitle) && (
        <div className="mb-6 text-center">
          {title && (
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          )}
          {subtitle && (
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}

export default AuthCard;
