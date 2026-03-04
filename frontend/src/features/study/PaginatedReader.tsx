import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ChevronUp,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface SummaryPage {
  pageNumber: number;
  fileId: string;
  fileName: string;
  content: string;
}

interface NotesPage {
  pageNumber: number;
  fileId: string;
  fileName: string;
  keyPoints: string[];
  detailed: string;
}

interface PaginatedReaderProps {
  type: 'summary' | 'notes';
  pages: SummaryPage[] | NotesPage[];
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export default function PaginatedReader({
  type,
  pages,
  onRegenerate,
  isRegenerating = false,
}: PaginatedReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [scrollPositions, setScrollPositions] = useState<Record<number, number>>({});
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const totalPages = pages.length;
  const page = pages[currentPage];

  // Save scroll position when changing pages
  const saveScrollPosition = useCallback(() => {
    if (contentRef.current) {
      setScrollPositions((prev) => ({
        ...prev,
        [currentPage]: contentRef.current!.scrollTop,
      }));
    }
  }, [currentPage]);

  // Restore scroll position
  useEffect(() => {
    if (contentRef.current && scrollPositions[currentPage] !== undefined) {
      contentRef.current.scrollTop = scrollPositions[currentPage];
    } else if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentPage, scrollPositions]);

  // Auto-hide header on scroll down (mobile only)
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const currentScrollY = contentRef.current.scrollTop;
      
      // Show header when scrolling up or at top, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll, { passive: true });
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY]);

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      saveScrollPosition();
      setCurrentPage(pageIndex);
    }
  };

  if (!page) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No content available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header - Auto-hiding on mobile, fixed on desktop */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: showHeader ? 0 : -100 }}
        transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="md:relative md:translate-y-0 fixed top-0 left-0 right-0 z-30 md:z-0 flex items-center justify-between p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-white/95 md:bg-white dark:bg-gray-900/95 dark:md:bg-gray-900 backdrop-blur-sm md:backdrop-blur-none shadow-sm md:shadow-none"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate">
            {page.fileName}
          </h3>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage + 1} of {totalPages}
          </p>
        </div>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        )}
      </motion.div>

      {/* Content - Optimized for mobile readability */}
      <div 
        ref={contentRef} 
        className="flex-1 overflow-y-auto pt-16 md:pt-0 pb-20 md:pb-6 px-4 md:px-6 bg-white dark:bg-gray-900 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 md:rounded-xl md:shadow-sm md:border border-gray-100 dark:border-gray-700 p-4 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {type === 'summary' ? (
              <div className="prose prose-base md:prose-lg prose-gray dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1
                        className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700"
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2
                        className="text-xl font-bold text-gray-900 dark:text-white mt-5 mb-3"
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2"
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p
                        className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4"
                        {...props}
                      />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong className="font-semibold text-gray-900 dark:text-white" {...props} />
                    ),
                    em: ({ node, ...props }) => (
                      <em className="italic text-gray-600 dark:text-gray-400" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        className="list-disc list-inside space-y-2 my-4 text-gray-700 dark:text-gray-300"
                        {...props}
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        className="list-decimal list-inside space-y-2 my-4 text-gray-700 dark:text-gray-300"
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="leading-relaxed" {...props} />
                    ),
                    code: ({ node, inline, className, children, ...props }: any) => {
                      return inline ? (
                        <code
                          className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          className={`block bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 rounded-lg overflow-x-auto text-sm font-mono my-3 border border-gray-200 dark:border-gray-700 ${className || ''}`}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {(page as SummaryPage).content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Key Points */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Key Points
                  </h4>
                  <ul className="space-y-2">
                    {(page as NotesPage).keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                          {i + 1}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Detailed Notes */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Detailed Notes
                  </h4>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1
                            className="text-xl font-bold text-gray-900 dark:text-white mt-5 mb-3"
                            {...props}
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2
                            className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2"
                            {...props}
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3
                            className="text-base font-semibold text-gray-900 dark:text-white mt-3 mb-2"
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p
                            className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4"
                            {...props}
                          />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-semibold text-gray-900 dark:text-white" {...props} />
                        ),
                        em: ({ node, ...props }) => (
                          <em className="italic text-gray-600 dark:text-gray-400" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            className="list-disc list-inside space-y-2 my-4 text-gray-700 dark:text-gray-300"
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            className="list-decimal list-inside space-y-2 my-4 text-gray-700 dark:text-gray-300"
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="leading-relaxed" {...props} />
                        ),
                        code: ({ node, inline, className, children, ...props }: any) => {
                          return inline ? (
                            <code
                              className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <code
                              className={`block bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 rounded-lg overflow-x-auto text-sm font-mono my-3 border border-gray-200 dark:border-gray-700 ${className || ''}`}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {(page as NotesPage).detailed}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      </div>

      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        {/* Page dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentPage
                  ? 'bg-blue-500 w-4'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile Floating Controls */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe">
        {/* Floating Navigation Buttons */}
        <div className="flex items-center justify-center gap-3 px-4 pb-4">
          {/* Previous Button */}
          <motion.button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all touch-manipulation active:scale-95 min-h-[48px]"
          >
            <ChevronLeft className="w-5 h-5" />
            Prev
          </motion.button>

          {/* Page Indicator FAB */}
          <motion.button
            onClick={() => setShowMobileNav(!showMobileNav)}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 min-w-[80px] min-h-[48px] touch-manipulation"
          >
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Page</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {currentPage + 1}/{totalPages}
            </span>
          </motion.button>

          {/* Next Button */}
          <motion.button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all touch-manipulation active:scale-95 min-h-[48px]"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Page Selection Drawer */}
        <AnimatePresence>
          {showMobileNav && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileNav(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm -z-10"
              />
              
              {/* Drawer */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-gray-800 p-6 mb-20"
              >
                {/* Handle */}
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Jump to Page
                </h3>

                {/* Page Grid */}
                <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        goToPage(i);
                        setShowMobileNav(false);
                      }}
                      className={`aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all min-h-[48px] ${
                        i === currentPage
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Scroll to Top FAB - Mobile Only */}
      <AnimatePresence>
        {!showHeader && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => {
              contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              setShowHeader(true);
            }}
            className="md:hidden fixed top-4 right-4 z-30 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronUp className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
