import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScreenFlashProps {
  timeLeft: string; // Format: "MM:SS"
}

export default function ScreenFlash({ timeLeft }: ScreenFlashProps) {
  const [flashType, setFlashType] = useState<'none' | 'warning' | 'critical'>('none');
  const [shouldFlash, setShouldFlash] = useState(false);

  useEffect(() => {
    // Parse time to get total seconds
    const [minutes, seconds] = timeLeft.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds;

    // Determine flash type based on time remaining
    if (totalSeconds <= 10 && totalSeconds > 0) {
      // Critical: Red flash at 10 seconds
      if (flashType !== 'critical') {
        setFlashType('critical');
        setShouldFlash(true);
        setTimeout(() => setShouldFlash(false), 500);
      }
    } else if (totalSeconds <= 60 && totalSeconds > 10) {
      // Warning: Orange flash at 60 seconds
      if (flashType !== 'warning') {
        setFlashType('warning');
        setShouldFlash(true);
        setTimeout(() => setShouldFlash(false), 500);
      }
    } else {
      setFlashType('none');
      setShouldFlash(false);
    }
  }, [timeLeft, flashType]);

  // Determine border color based on flash type
  const getBorderColor = () => {
    if (flashType === 'critical') {
      return 'rgba(239, 68, 68, 0.4)'; // Red
    }
    if (flashType === 'warning') {
      return 'rgba(249, 115, 22, 0.3)'; // Orange
    }
    return 'transparent';
  };

  // Show persistent border for warning/critical states
  const showPersistentBorder = flashType !== 'none';

  return (
    <>
      {/* Flash effect */}
      <AnimatePresence>
        {shouldFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 pointer-events-none z-40"
            style={{
              boxShadow: `inset 0 0 0 8px ${
                flashType === 'critical'
                  ? 'rgba(239, 68, 68, 0.8)'
                  : 'rgba(249, 115, 22, 0.6)'
              }`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Persistent subtle border for warning/critical states */}
      {showPersistentBorder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 pointer-events-none z-40 ${
            flashType === 'critical' ? 'animate-pulse' : ''
          }`}
          style={{
            boxShadow: `inset 0 0 0 4px ${getBorderColor()}`,
          }}
        />
      )}
    </>
  );
}
