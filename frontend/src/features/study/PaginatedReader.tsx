import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
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
    <div className="flex flex-col h-full">
      {/* Header with page info */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{page.fileName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage + 1} of {totalPages}
          </p>
        </div>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        )}
      </div>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {type === 'summary' ? (
              <div className="prose prose-gray dark:prose-invert max-w-none">
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
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                          {i + 1}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{point}</span>
                      </motion.li>
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
                      rehypePlugins={[rehypeHighlight]}
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

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
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
    </div>
  );
}
