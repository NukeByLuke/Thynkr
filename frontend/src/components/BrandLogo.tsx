import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'icon';
  animated?: boolean;
  className?: string;
}

export default function BrandLogo({
  variant = 'full',
  animated = true,
  className = '',
}: BrandLogoProps) {
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Only animate once on mount
    if (animated && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [animated, hasAnimated]);

  // Always navigate to home page
  const logoDestination = '/';

  const iconVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 15,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.2,
        duration: 0.4,
      },
    },
  };

  const Icon = () => (
    <motion.div
      initial={animated && !hasAnimated ? 'hidden' : 'visible'}
      animate="visible"
      variants={iconVariants}
      whileHover={{ scale: 1.05, rotate: 5 }}
      className="relative group"
    >
      {/* Pulsing gradient border on hover */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(45deg, #4F46E5, #22D3EE, #6366F1, #22D3EE)',
          backgroundSize: '200% 200%',
          filter: 'blur(8px)',
          padding: '2px',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Logo SVG */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        <motion.path
          d="M32 4L56 28L32 52L8 28L32 4Z"
          fill="url(#gradient1)"
          stroke="url(#gradient2)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
        <ellipse cx="32" cy="38" rx="4" ry="2.5" fill="#6366F1" opacity="0.8" />
        <rect x="30" y="35" width="4" height="3" rx="0.5" fill="#6366F1" opacity="0.8" />
        <path
          d="M32 18C27 18 23 22 23 27C23 29 23.5 30.8 24.5 32.2C25 33 25.5 33.7 25.5 34.5V36H38.5V34.5C38.5 33.7 39 33 39.5 32.2C40.5 30.8 41 29 41 27C41 22 37 18 32 18Z"
          fill="url(#gradient3)"
        />
        <path
          d="M28 24C28 24 27 26 27 28"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M32 22C32 22 32 24 32 27"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M36 24C36 24 37 26 37 28"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <motion.circle
          cx="38"
          cy="21"
          r="1.5"
          fill="#22D3EE"
          opacity="0.9"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <circle cx="26" cy="21" r="1" fill="#22D3EE" opacity="0.7" />

        <defs>
          <linearGradient
            id="gradient1"
            x1="8"
            y1="4"
            x2="56"
            y2="52"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient
            id="gradient2"
            x1="8"
            y1="4"
            x2="56"
            y2="52"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient
            id="gradient3"
            x1="23"
            y1="18"
            x2="41"
            y2="36"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#A5B4FC" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );

  if (variant === 'icon') {
    return (
      <Link to={logoDestination} className={`inline-block ${className}`}>
        <Icon />
      </Link>
    );
  }

  return (
    <Link to={logoDestination} className={`flex items-center gap-2.5 ${className}`}>
      <Icon />
      <motion.span
        initial={animated && !hasAnimated ? 'hidden' : 'visible'}
        animate="visible"
        variants={textVariants}
        className="text-2xl font-semibold tracking-wide bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        thynkr
      </motion.span>
    </Link>
  );
}
