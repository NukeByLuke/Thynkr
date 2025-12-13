/**
 * UpgradeModal Component
 * Clean modal prompting users to upgrade to Thynkr Pro
 * Used when Free users hit game limits or try to host.
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Users, Infinity, X } from 'lucide-react';
import { clsx } from 'clsx';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

// =============================================================================
// Types
// =============================================================================

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'no_credits' | 'hosting_restricted' | null;
}

// =============================================================================
// Content Configuration
// =============================================================================

const MODAL_CONTENT = {
  no_credits: {
    title: 'Out of Daily Plays',
    subtitle: "You've used all 3 free games for today.",
    cta: 'Upgrade for unlimited',
  },
  hosting_restricted: {
    title: 'Hosting is Pro Only',
    subtitle: 'Free users can join any game, but hosting requires Pro.',
    cta: 'Upgrade to Host',
  },
  default: {
    title: 'Unlock Unlimited Learning',
    subtitle: 'Host live games and play unlimited solo rounds with Thynkr Pro.',
    cta: 'Upgrade to Pro',
  },
};

const PRO_FEATURES = [
  { icon: Infinity, label: 'Unlimited solo games' },
  { icon: Users, label: 'Host multiplayer sessions' },
  { icon: Zap, label: '2x XP bonus on all games' },
];

// =============================================================================
// Component
// =============================================================================

export default function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const navigate = useNavigate();
  const content = reason ? MODAL_CONTENT[reason] : MODAL_CONTENT.default;

  const handleUpgrade = () => {
    onClose();
    navigate('/settings?tab=billing');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="relative p-6 text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className={clsx(
            'absolute top-4 right-4 p-2 rounded-lg',
            'text-slate-400 hover:text-slate-600',
            'dark:text-slate-500 dark:hover:text-slate-300',
            'hover:bg-slate-100 dark:hover:bg-slate-700',
            'transition-colors'
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <motion.div
          className={clsx(
            'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6',
            'bg-gradient-to-br from-amber-400 to-orange-500'
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>

        {/* Title */}
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{content.title}</h2>

        {/* Subtitle */}
        <p className="text-slate-500 dark:text-slate-400 mb-6">{content.subtitle}</p>

        {/* Features List */}
        <div className="space-y-3 mb-8">
          {PRO_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.label}
                className="flex items-center gap-3 text-left"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={clsx(
                    'flex-shrink-0 w-8 h-8 rounded-lg',
                    'flex items-center justify-center',
                    'bg-amber-100 dark:bg-amber-500/20'
                  )}
                >
                  <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {feature.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleUpgrade}
          className={clsx(
            'w-full py-3',
            'bg-gradient-to-r from-amber-500 to-orange-500',
            'hover:from-amber-600 hover:to-orange-600',
            'text-white font-semibold'
          )}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {content.cta}
        </Button>

        {/* Dismiss link */}
        <button
          onClick={onClose}
          className={clsx(
            'mt-4 text-sm text-slate-400 dark:text-slate-500',
            'hover:text-slate-600 dark:hover:text-slate-300',
            'transition-colors'
          )}
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
