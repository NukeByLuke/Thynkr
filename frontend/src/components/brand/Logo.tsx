/**
 * Thynkr Brand Logo System
 * A scalable, theme-aware SVG component representing the "Synapse Spark".
 */

import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface ThynkrLogoProps {
  variant?: 'icon' | 'wordmark';
  className?: string;
  animated?: boolean;
}

export default function ThynkrLogo({
  variant = 'wordmark',
  className,
  animated = false,
}: ThynkrLogoProps) {
  const isWordmark = variant === 'wordmark';
  
  // ViewBox calculations
  // Icon only: 40x40
  // Wordmark: 140x40 (Icon + Text)
  const viewBox = isWordmark ? "0 0 140 40" : "0 0 40 40";

  return (
    <svg
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('h-10 w-auto', className)}
      aria-label="Thynkr Logo"
    >
      {/* The Synapse Spark Symbol (40x40) */}
      <g className="origin-center">
        {/* Central Core - The "Spark" */}
        <motion.circle
          cx="20"
          cy="20"
          r="4.5"
          className="fill-cyan-500"
          initial={false}
          animate={animated ? { scale: [1, 1.1, 1] } : undefined}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Connections - Radiating Lines */}
        <g className="text-current stroke-current" strokeWidth="2.5" strokeLinecap="round">
          {/* Top Right Connection */}
          <path d="M24 16L29 11" />
          <circle cx="31" cy="9" r="2" className="fill-current stroke-none" />

          {/* Bottom Right Connection */}
          <path d="M24 24L29 29" />
          <circle cx="31" cy="31" r="2" className="fill-current stroke-none" />

          {/* Left Connection */}
          <path d="M15.5 20L9.5 20" />
          <circle cx="7" cy="20" r="2" className="fill-current stroke-none" />
        </g>
      </g>

      {/* The Wordmark "Thynkr" (Offset x=45) */}
      {isWordmark && (
        <g transform="translate(45, 0)" className="fill-current text-current">
          {/* T */}
          <path d="M2 8H14V32H10V11.5H6V32H2V8Z" /> 
          {/* h */}
          <path d="M18 2V32H22V20C22 17.5 23.5 16 26 16C28.5 16 30 17.5 30 20V32H34V19C34 15 31.5 12.5 28 12.5C25.5 12.5 23.5 13.5 22 15V13H18V2Z" />
          {/* y */}
          <path d="M38 13L43 26L48 13H52.5L45 31V38H41V31L33.5 13H38Z" />
          {/* n */}
          <path d="M56 13H60V15C61.5 13.5 63.5 12.5 66 12.5C69.5 12.5 72 15 72 19V32H68V20C68 17.5 66.5 16 64 16C61.5 16 60 17.5 60 20V32H56V13Z" />
          {/* k */}
          <path d="M76 2V32H80V23L86 32H91L83.5 21L90.5 13H85.5L80 19.5V2H76Z" />
          {/* r */}
          <path d="M95 13H99V15.5C100 13.5 102 12.5 104.5 12.5V16.5C101.5 16.5 99 18 99 21V32H95V13Z" />
        </g>
      )}
    </svg>
  );
}
