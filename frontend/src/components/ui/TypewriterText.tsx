/**
 * TypewriterText Component
 * Renders text with a typewriter effect, supporting Markdown content.
 * Optimized for AI summary generation - makes content feel faster and more engaging.
 */

import { useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface TypewriterTextProps {
  content: string;
  speed?: number; // ms per character (default: 15)
  isGenerating?: boolean; // If true, use typewriter effect
  onComplete?: () => void;
  // Custom markdown components (passed through to ReactMarkdown)
  components?: Record<string, React.ComponentType<any>>;
}

export default function TypewriterText({
  content,
  speed = 15,
  isGenerating = false,
  onComplete,
  components,
}: TypewriterTextProps) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(!isGenerating);
  const prevContentRef = useRef(content);
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Reset when content changes or isGenerating changes to true
  useEffect(() => {
    if (isGenerating && content !== prevContentRef.current) {
      // New content is being generated, start from beginning
      setDisplayedLength(0);
      setIsComplete(false);
      prevContentRef.current = content;
    } else if (!isGenerating && displayedLength === 0 && content) {
      // Content loaded instantly (not generating), show all immediately
      setDisplayedLength(content.length);
      setIsComplete(true);
    }
  }, [content, isGenerating, displayedLength]);

  // Typewriter animation using requestAnimationFrame for smooth performance
  useEffect(() => {
    if (isComplete || displayedLength >= content.length) {
      if (!isComplete) {
        setIsComplete(true);
        onComplete?.();
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastUpdateRef.current) {
        lastUpdateRef.current = timestamp;
      }

      const elapsed = timestamp - lastUpdateRef.current;

      if (elapsed >= speed) {
        // Calculate how many characters to add based on elapsed time
        // This ensures smooth animation even if frames are dropped
        const charsToAdd = Math.max(1, Math.floor(elapsed / speed));
        
        setDisplayedLength((prev) => {
          const newLength = Math.min(prev + charsToAdd, content.length);
          return newLength;
        });

        lastUpdateRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [content, displayedLength, isComplete, speed, onComplete]);

  // Get the displayed portion of content
  const displayedContent = useMemo(() => {
    if (isComplete || displayedLength >= content.length) {
      return content;
    }
    
    // For markdown, we need to be careful about cutting mid-syntax
    // Simple approach: just slice and let markdown handle partial content
    // More sophisticated: find safe cut points (end of words/sentences)
    const sliced = content.slice(0, displayedLength);
    
    // Try to cut at a word boundary for cleaner rendering
    // Only do this if we're not at a natural break point
    if (displayedLength < content.length) {
      const lastSpace = sliced.lastIndexOf(' ');
      const lastNewline = sliced.lastIndexOf('\n');
      const lastBreak = Math.max(lastSpace, lastNewline);
      
      // If we're close to a break point and not at the start, use it
      if (lastBreak > displayedLength - 20 && lastBreak > 0) {
        return sliced.slice(0, lastBreak + 1);
      }
    }
    
    return sliced;
  }, [content, displayedLength, isComplete]);

  // Default markdown components if none provided
  const defaultComponents = useMemo(() => ({
    // These are minimal defaults - the parent should provide full styling
    p: ({ children }: { children: ReactNode }) => <p className="mb-4">{children}</p>,
    strong: ({ children }: { children: ReactNode }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }: { children: ReactNode }) => <em className="italic">{children}</em>,
    h1: ({ children }: { children: ReactNode }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
    h2: ({ children }: { children: ReactNode }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
    h3: ({ children }: { children: ReactNode }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
    ul: ({ children }: { children: ReactNode }) => <ul className="list-disc ml-6 mb-4">{children}</ul>,
    ol: ({ children }: { children: ReactNode }) => <ol className="list-decimal ml-6 mb-4">{children}</ol>,
    li: ({ children }: { children: ReactNode }) => <li className="mb-1">{children}</li>,
    code: ({ children, className }: { children: ReactNode; className?: string }) => {
      const isInline = !className;
      return isInline ? (
        <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">{children}</code>
      ) : (
        <code className={`block bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto ${className || ''}`}>
          {children}
        </code>
      );
    },
  }), []);

  const mergedComponents = useMemo(() => ({
    ...defaultComponents,
    ...components,
  }), [defaultComponents, components]);

  return (
    <div className="typewriter-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={mergedComponents as any}
      >
        {displayedContent}
      </ReactMarkdown>
      {/* Blinking cursor when typing */}
      {!isComplete && (
        <span className="inline-block w-0.5 h-5 bg-current animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}
