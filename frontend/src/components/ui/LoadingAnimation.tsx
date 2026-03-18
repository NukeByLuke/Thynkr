import BrandLoader from './BrandLoader';

interface LoadingAnimationProps {
  size?: number;
  className?: string;
  light?: boolean;
}

export default function LoadingAnimation({
  size = 96,
  className = '',
  light = false,
}: LoadingAnimationProps) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <BrandLoader dimension={size} highContrast={light} />
    </div>
  );
}
