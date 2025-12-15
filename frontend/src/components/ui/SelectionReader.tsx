import { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';

export default function SelectionReader() {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0, visible: false });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { play } = usePlayerStore();

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        // No selection or empty selection
        setPosition((prev) => ({ ...prev, visible: false }));
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      
      // Minimum text length to show the reader
      if (text.length < 3) {
        setPosition((prev) => ({ ...prev, visible: false }));
        setSelectedText('');
        return;
      }

      setSelectedText(text);

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Calculate tooltip position (centered above selection)
        const tooltipWidth = 100; // Approximate width
        const top = rect.top + window.scrollY - 50; // 50px above selection
        const left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);

        setPosition({
          top,
          left,
          visible: true,
        });
      } catch (error) {
        console.error('Error getting selection position:', error);
        setPosition((prev) => ({ ...prev, visible: false }));
      }
    };

    // Listen for selection changes
    document.addEventListener('selectionchange', handleSelectionChange);

    // Also listen for mouse up to catch selection on mobile
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('touchend', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
    };
  }, []);

  const handleRead = () => {
    if (selectedText) {
      play(selectedText);
      // Clear selection after playing
      window.getSelection()?.removeAllRanges();
      setPosition((prev) => ({ ...prev, visible: false }));
    }
  };

  if (!position.visible || !selectedText) {
    return null;
  }

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <button
        onClick={handleRead}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg shadow-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-700 dark:border-slate-600"
      >
        <Volume2 className="w-4 h-4" />
        <span className="text-sm font-medium whitespace-nowrap">Read</span>
      </button>
      
      {/* Arrow pointing down to selection */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full">
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900 dark:border-t-slate-800"></div>
      </div>
    </div>
  );
}
