import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

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

export default function LoadingAnimation({
  size = 96,
  className = '',
  light = false,
}: LoadingAnimationProps) {
  const [animationData, setAnimationData] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Fetch the animation JSON
    fetch('/animations/thynkr-loading.json')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load animation');
        return response.json();
      })
      .then((data) => setAnimationData(data))
      .catch(() => setError(true));
  }, []);

  // Show fallback spinner if error or still loading
  if (error || !animationData) {
    return (
      <div className={className} style={{ width: size, height: size }}>
        <FallbackSpinner />
      </div>
    );
  }

  return (
    <div className={className} style={{ width: size, height: size }}>
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{
          height: size,
          width: size,
          filter: light ? 'drop-shadow(0 0 6px rgba(255,255,255,0.35))' : 'none',
        }}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid slice',
        }}
      />
    </div>
  );
}
