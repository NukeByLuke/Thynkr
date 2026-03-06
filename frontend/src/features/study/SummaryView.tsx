import { useMemo } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  const estimatedReadMinutes = useMemo(() => {
    const words = normalizedContent.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 180));
  }, [normalizedContent]);

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
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 shadow-xl">
        <div className="absolute -top-24 -right-16 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />
        <div className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-500/10" />

        <div className="relative z-10 p-4 sm:p-7 lg:p-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-slate-200 dark:border-white/10">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                AI Study Brief
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Summary</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Estimated reading time: {estimatedReadMinutes} min</p>
            </div>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-cyan-700 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-cyan-200 bg-cyan-50 dark:bg-cyan-500/15 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Regenerate summary with latest AI"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
            )}
          </div>

          <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none min-w-0 break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }: any) => (
                <h1
                  className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-4 sm:mt-6 mb-3 sm:mb-4 pb-2 border-b-2 border-slate-200/80 dark:border-white/10"
                  {...props}
                />
              ),
              h2: ({ node, ...props }: any) => (
                <h2
                  className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mt-5 sm:mt-6 mb-2 sm:mb-3 pl-2 sm:pl-3 border-l-4 border-cyan-500 dark:border-cyan-400"
                  {...props}
                />
              ),
              h3: ({ node, ...props }: any) => (
                <h3
                  className="text-base sm:text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-200 mt-4 sm:mt-5 mb-2"
                  {...props}
                />
              ),
              h4: ({ node, ...props }: any) => (
                <h4
                  className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200 mt-4 sm:mt-5 mb-2"
                  {...props}
                />
              ),
              strong: ({ node, ...props }: any) => (
                <strong className="font-bold text-slate-900 dark:text-white" {...props} />
              ),
              blockquote: ({ node, ...props }: any) => (
                <blockquote
                  className="border-l-4 border-cyan-400 dark:border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 p-4 rounded-r-lg italic text-gray-700 dark:text-gray-300 my-4 shadow-sm"
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
                  className="list-disc ml-5 sm:ml-7 space-y-2 sm:space-y-3 mb-5 sm:mb-6 text-gray-700 dark:text-gray-300 marker:text-cyan-500 dark:marker:text-cyan-400"
                  {...props}
                />
              ),
              ol: ({ node, ...props }: any) => (
                <ol
                  className="list-decimal ml-5 sm:ml-7 space-y-2 sm:space-y-3 mb-5 sm:mb-6 text-gray-700 dark:text-gray-300 marker:text-cyan-500 dark:marker:text-cyan-400"
                  {...props}
                />
              ),
              li: ({ node, ...props }: any) => <li className="leading-relaxed sm:leading-loose pl-2 break-words" {...props} />,
              code: ({ node, className, children, ...props }: any) => {
                const isInline = !className;
                return isInline ? (
                  <code
                    className="bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-200 px-2.5 py-1 rounded-lg text-sm font-mono border border-cyan-200 dark:border-cyan-500/30 shadow-sm"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <code
                    className={`block bg-slate-900 dark:bg-slate-950 text-slate-100 p-6 rounded-2xl overflow-x-auto text-sm font-mono shadow-xl border border-slate-700 dark:border-slate-800 my-6 ${className || ''}`}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              pre: ({ node, ...props }: any) => <pre className="my-4" {...props} />,
              a: ({ node, ...props }: any) => (
                <a
                  className="text-cyan-700 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-cyan-200 underline decoration-cyan-300 dark:decoration-cyan-600 hover:decoration-cyan-500 dark:hover:decoration-cyan-400 transition-colors"
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
    </div>
  );
}
