import { useEffect, useState, useCallback, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { useAudioActions } from '../../contexts/AudioContext';

/**
 * SelectionReader - Global text selection reader with audio playback
 * 
 * Performance optimizations:
 * - Debounced selection detection (300ms)
 * - Passive event listeners
 * - RAF-based position updates
 * - Proper cleanup on unmount
 */

interface SelectionPosition {
  top: number;
  left: number;
  width: number;
}

/**
 * Custom hook for optimized text selection detection
 * Uses debouncing and RAF to minimize performance impact
 */
function useTextSelection(debounceMs: number = 300) {
  const [selectedText, setSelectedText] = useState<string>('');
  const [position, setPosition] = useState<SelectionPosition | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const handleSelectionChange = useCallback(() => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the selection check
    debounceTimerRef.current = setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';

      // Only process if we have actual text (minimum 3 characters)
      if (text.length >= 3) {
        setSelectedText(text);

        // Use RAF for smooth position updates
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }

        rafIdRef.current = requestAnimationFrame(() => {
          const range = selection?.getRangeAt(0);
          if (range) {
            const rect = range.getBoundingClientRect();
            
            // Position tooltip above the selection
            setPosition({
              top: rect.top + window.scrollY - 48, // 48px above selection
              left: rect.left + window.scrollX + rect.width / 2, // Center horizontally
              width: rect.width,
            });
          }
        });
      } else {
        // Clear selection if text is too short
        setSelectedText('');
        setPosition(null);
      }
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    // Add passive listener for better scroll performance
    document.addEventListener('selectionchange', handleSelectionChange, { passive: true } as AddEventListenerOptions);

    // Cleanup function
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      
      // Clear timers and RAF
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [handleSelectionChange]);

  const clearSelection = useCallback(() => {
    setSelectedText('');
    setPosition(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  return { selectedText, position, clearSelection };
}

/**
 * Tooltip component with minimalist design
 */
interface TooltipProps {
  position: SelectionPosition;
  onPlay: () => void;
  text: string;
}

const SelectionTooltip = ({ position, onPlay, text }: TooltipProps) => {
  return (
    <div
      className="fixed z-[9999] pointer-events-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)', // Center the tooltip
      }}
    >
      {/* Minimalist black/white tooltip */}
      <button
        onClick={onPlay}
        className="flex items-center gap-2 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg shadow-lg hover:scale-105 transition-transform duration-150 border border-slate-700 dark:border-slate-300"
        aria-label={`Read selected text: ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`}
        title="Play selected text"
      >
        <Volume2 className="w-4 h-4" />
        <span className="text-sm font-medium">Play</span>
      </button>

      {/* Arrow pointing down to selection */}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid rgb(15, 23, 42)', // slate-900
        }}
      />
    </div>
  );
};

/**
 * Main SelectionReader component
 */
export const SelectionReader = () => {
  const { selectedText, position, clearSelection } = useTextSelection(300);
  const { addToQueue } = useAudioActions();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlay = useCallback(async () => {
    if (!selectedText || isProcessing) return;

    setIsProcessing(true);

    try {
      // Add selected text to audio queue
      await addToQueue({
        id: `selection-${Date.now()}`, // Generate unique ID
        text: selectedText,
        title: `${selectedText.slice(0, 50)}${selectedText.length > 50 ? '...' : ''}`,
      });

      // Clear selection after adding to queue
      clearSelection();
    } catch (error) {
      console.error('Failed to add selection to audio queue:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedText, addToQueue, clearSelection, isProcessing]);

  // Hide tooltip when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't clear if clicking the tooltip itself
      const target = e.target as HTMLElement;
      if (target.closest('[data-selection-tooltip]')) return;

      clearSelection();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    if (selectedText) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [selectedText, clearSelection]);

  // Don't render if no text is selected
  if (!selectedText || !position) {
    return null;
  }

  return (
    <div data-selection-tooltip>
      <SelectionTooltip
        position={position}
        onPlay={handlePlay}
        text={selectedText}
      />
    </div>
  );
};

export default SelectionReader;
