/**
 * Player Keyboard Shortcuts Hook
 * Provides global keyboard shortcuts for audio player control
 * 
 * Shortcuts:
 * - Alt + P or Space (no input focused): Toggle play/pause
 * - Alt + S: Stop playback
 * - Alt + Up: Increase speed
 * - Alt + Down: Decrease speed
 */

import { useEffect } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import toast from 'react-hot-toast';

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

/**
 * Check if an element is an input-like element that should capture Space key
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  const isContentEditable = (element as HTMLElement).isContentEditable;
  
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isContentEditable ||
    element.getAttribute('role') === 'textbox'
  );
}

/**
 * Find nearest speed option in array
 */
function findNearestSpeed(currentSpeed: number, direction: 'up' | 'down'): number {
  const currentIndex = SPEED_OPTIONS.findIndex(s => Math.abs(s - currentSpeed) < 0.01);
  
  if (currentIndex !== -1) {
    // If exact match, move to next/prev
    if (direction === 'up' && currentIndex < SPEED_OPTIONS.length - 1) {
      return SPEED_OPTIONS[currentIndex + 1];
    }
    if (direction === 'down' && currentIndex > 0) {
      return SPEED_OPTIONS[currentIndex - 1];
    }
    return currentSpeed; // Already at min/max
  }
  
  // If not exact match, find closest option
  const sorted = [...SPEED_OPTIONS].sort((a, b) => Math.abs(a - currentSpeed) - Math.abs(b - currentSpeed));
  return sorted[0];
}

/**
 * Hook to enable global keyboard shortcuts for player control
 */
export function usePlayerShortcuts() {
  const { isPlaying, text, speed, play, pause, stop, setSpeed } = usePlayerStore();
  
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Alt + P: Toggle play/pause
      if (event.altKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        
        if (!text) {
          toast.error('No audio loaded');
          return;
        }
        
        if (isPlaying) {
          pause();
          toast('Paused', { icon: '⏸️', duration: 1500 });
        } else {
          play(text);
          toast('Playing', { icon: '▶️', duration: 1500 });
        }
        return;
      }
      
      // Space: Toggle play/pause (only if no input is focused)
      if (event.key === ' ' && !isInputElement(document.activeElement)) {
        event.preventDefault();
        
        if (!text) {
          return; // Don't show error for space when nothing loaded
        }
        
        if (isPlaying) {
          pause();
        } else {
          play(text);
        }
        return;
      }
      
      // Alt + S: Stop playback
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        
        if (text) {
          stop();
          toast('Stopped', { icon: '⏹️', duration: 1500 });
        }
        return;
      }
      
      // Alt + Up: Increase speed
      if (event.altKey && event.key === 'ArrowUp') {
        event.preventDefault();
        
        const newSpeed = findNearestSpeed(speed, 'up');
        if (newSpeed !== speed) {
          setSpeed(newSpeed);
          toast(`Speed: ${newSpeed}×`, { icon: '⚡', duration: 1500 });
        } else {
          toast('Maximum speed', { icon: '⚡', duration: 1500 });
        }
        return;
      }
      
      // Alt + Down: Decrease speed
      if (event.altKey && event.key === 'ArrowDown') {
        event.preventDefault();
        
        const newSpeed = findNearestSpeed(speed, 'down');
        if (newSpeed !== speed) {
          setSpeed(newSpeed);
          toast(`Speed: ${newSpeed}×`, { icon: '🐌', duration: 1500 });
        } else {
          toast('Minimum speed', { icon: '🐌', duration: 1500 });
        }
        return;
      }
    }
    
    // Attach listener to window
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, text, speed, play, pause, stop, setSpeed]);
}
