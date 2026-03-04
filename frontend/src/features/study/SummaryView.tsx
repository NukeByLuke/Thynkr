import { useMemo } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface SummaryViewProps {
  content: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  error?: Error | null;
}

export default function SummaryView({ content, onRegenerate, isRegenerating, error }: SummaryViewProps) {
  // Normalize AI-generated heading markers like "H1:", "H2:", "H3:" into real Markdown
  const normalizedContent = useMemo(() => {
    return content
      // Convert lines starting with H{1-6}: Title -> #{1-6} Title
      .replace(/(^|\n)H([1-6])\s*:\s*(.+)/gm, (_m, p1, lvl, txt) => `${p1}${'#'.repeat(Number(lvl))} ${String(txt).trim()}`)
      // Also handle forms like "H3 Title" without a colon
      .replace(/(^|\n)\s*H([1-6])\s+(.+)/gm, (_m, p1, lvl, txt) => `${p1}${'#'.repeat(Number(lvl))} ${String(txt).trim()}`);
  }, [content]);

  // Show error alert if generation failed
  if (error) {
    return (
      <div className="max-w-none animate-fade-in">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Failed to Generate Summary</h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{error.message || 'An unexpected error occurred. Please try again.'}</p>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-none w-full min-w-0 animate-fade-in space-y-4 sm:space-y-6">
      {/* Summary Content */}
      <div className="bg-gradient-to-br from-white to-brand-50/50 dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-lg border border-brand-100/50 dark:border-gray-700 p-3 sm:p-6 lg:p-10 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-8 pb-4 border-b-2 border-brand-200/50 dark:border-gray-700">
          <h3 className="text-xl sm:text-3xl font-bold">
            <span className="hidden dark:block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-violet-500">
              Summary
            </span>
            <span className="block dark:hidden text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-fuchsia-600 to-fuchsia-700">
              Summary
            </span>
          </h3>
          <div className="flex items-center gap-3">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-fuchsia-600 dark:text-violet-400 hover:text-fuchsia-700 dark:hover:text-violet-300 bg-fuchsia-50 dark:bg-violet-900/30 hover:bg-fuchsia-100 dark:hover:bg-violet-900/50 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                title="Regenerate summary with latest AI"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
            )}
          </div>
        </div>
        <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none min-w-0 break-words">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }: any) => (
                <h1
                  className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-pink-600 via-fuchsia-600 to-orange-500 dark:from-cyan-400 dark:via-violet-500 dark:to-blue-500 bg-clip-text text-transparent mt-4 sm:mt-6 mb-3 sm:mb-4 pb-2 border-b-2 border-pink-200/60 dark:border-violet-500/30"
                  {...props}
                />
              ),
              h2: ({ node, ...props }: any) => (
                <h2
                  className="text-lg sm:text-xl md:text-2xl font-bold text-brand-700 dark:text-brand-200 mt-5 sm:mt-6 mb-2 sm:mb-3 pl-2 sm:pl-3 border-l-4 border-pink-500 dark:border-cyan-500"
                  {...props}
                />
              ),
              h3: ({ node, ...props }: any) => (
                <h3
                  className="text-base sm:text-lg md:text-xl font-semibold text-brand-700 dark:text-brand-300 mt-4 sm:mt-5 mb-2 flex items-center gap-2"
                  {...props}
                />
              ),
              h4: ({ node, ...props }: any) => (
                <h4
                  className="text-base sm:text-lg font-semibold text-brand-700 dark:text-brand-300 mt-4 sm:mt-5 mb-2"
                  {...props}
                />
              ),
              strong: ({ node, ...props }: any) => (
                <strong className="font-bold text-brand-700 dark:text-brand-300" {...props} />
              ),
              blockquote: ({ node, ...props }: any) => (
                <blockquote
                  className="border-l-4 border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/10 p-4 rounded-r-lg italic text-gray-700 dark:text-gray-300 my-4 shadow-sm"
                  {...props}
                />
              ),
              p: ({ node, ...props }: any) => (
                <p
                  className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg break-words"
                  {...props}
                />
              ),
              ul: ({ node, ...props }: any) => (
                <ul
                  className="list-disc ml-5 sm:ml-7 space-y-2 sm:space-y-3 mb-5 sm:mb-6 text-gray-700 dark:text-gray-300 marker:text-brand-500 dark:marker:text-brand-400"
                  {...props}
                />
              ),
              ol: ({ node, ...props }: any) => (
                <ol
                  className="list-decimal ml-5 sm:ml-7 space-y-2 sm:space-y-3 mb-5 sm:mb-6 text-gray-700 dark:text-gray-300 marker:text-brand-500 dark:marker:text-brand-400"
                  {...props}
                />
              ),
              li: ({ node, ...props }: any) => <li className="leading-relaxed sm:leading-loose pl-2 break-words" {...props} />,
              code: ({ node, className, children, ...props }: any) => {
                const isInline = !className;
                return isInline ? (
                  <code
                    className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2.5 py-1 rounded-lg text-sm font-mono border border-brand-200 dark:border-brand-800 shadow-sm"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <code
                    className={`block bg-gray-900 dark:bg-gray-950 text-gray-100 p-6 rounded-2xl overflow-x-auto text-sm font-mono shadow-xl border border-gray-700 dark:border-gray-800 my-6 ${className || ''}`}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              pre: ({ node, ...props }: any) => <pre className="my-4" {...props} />,
              a: ({ node, ...props }: any) => (
                <a
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline decoration-primary-300 dark:decoration-primary-600 hover:decoration-primary-500 dark:hover:decoration-primary-400 transition-colors"
                  {...props}
                />
              ),
              table: ({ node, ...props }: any) => (
                <div className="overflow-x-auto my-5">
                  <table
                    className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg"
                    {...props}
                  />
                </div>
              ),
              thead: ({ node, ...props }: any) => (
                <thead className="bg-gray-100 dark:bg-gray-800" {...props} />
              ),
              tbody: ({ node, ...props }: any) => (
                <tbody
                  className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900"
                  {...props}
                />
              ),
              tr: ({ node, ...props }: any) => (
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  {...props}
                />
              ),
              th: ({ node, ...props }: any) => (
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider"
                  {...props}
                />
              ),
              td: ({ node, ...props }: any) => (
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300" {...props} />
              ),
              hr: ({ node, ...props }: any) => (
                <hr className="my-8 border-t-2 border-gray-300 dark:border-gray-700" {...props} />
              ),
            }}
          >
            {normalizedContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
