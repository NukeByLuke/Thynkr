// Fallback CSS spinner for when Lottie can't load
const FallbackSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-transparent border-t-cyan-400 border-l-purple-400 rounded-full animate-spin" />
  </div>
);

interface LoadingAnimationProps {
  size?: number;
  className?: string;
  light?: boolean; // if true, use light version colors on dark background
}

export default function LoadingAnimation({ size = 96, className = '', light = false }: LoadingAnimationProps) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      {/* Using Lottie web component via script include (no npm dep) */}
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <lottie-player
        autoplay
        loop
        src="/animations/thynkr-loading.json"
        style={{ height: size, width: size, filter: light ? 'drop-shadow(0 0 6px rgba(255,255,255,0.35))' : 'none' }}
      />
      <noscript>
        <FallbackSpinner />
      </noscript>
    </div>
  );
}
