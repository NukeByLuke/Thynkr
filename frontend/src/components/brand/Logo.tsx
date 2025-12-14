/**
 * Thynkr Brand Logo System
 * Uses raster images from public/brand/logo.png
 */

import { clsx } from 'clsx';
import { useTheme } from '@/contexts/ThemeContext';

interface ThynkrLogoProps {
  variant?: 'full' | 'symbol';
  className?: string;
  theme?: 'light' | 'dark';
}

export default function ThynkrLogo({
  variant = 'full',
  className,
  theme: themeOverride,
}: ThynkrLogoProps) {
  const { theme: currentTheme } = useTheme();
  const theme = themeOverride || currentTheme;
  
  const isSymbolOnly = variant === 'symbol';
  
  // Path to the logo image in public/brand/
  const logoSrc = theme === 'dark' 
    ? '/brand/logo-dark.png' 
    : '/brand/logo-light.png';

  if (isSymbolOnly) {
    return (
      <img
        src={logoSrc}
        alt="Thynkr Symbol"
        className={clsx('object-contain w-full h-full', className)}
      />
    );
  }

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <img
        src={logoSrc}
        alt="Thynkr Logo"
        className="h-16 w-16 object-contain flex-shrink-0"
      />
      <span
        className={clsx(
          "text-xl font-bold tracking-tight",
          theme === 'dark' ? "text-white" : "text-slate-900"
        )}
        style={{
          fontFamily: "'Inter', 'Geist', sans-serif",
          fontWeight: 700,
          letterSpacing: '-0.03em',
        }}
      >
        Thynkr
      </span>
    </div>
  );
}
