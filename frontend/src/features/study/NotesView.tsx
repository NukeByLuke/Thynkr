/* eslint-disable @typescript-eslint/no-unused-vars */
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface NotesViewProps {
  keyPoints: string[];
  detailed: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  error?: Error | null;
}

export default function NotesView({
  keyPoints,
  detailed,
  onRegenerate,
  isRegenerating,
  error,
}: NotesViewProps) {
  // Show error alert if generation failed
  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Failed to Generate Notes</h3>
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
    <div className="space-y-8 animate-fade-in">
      {/* Regenerate Button */}
      {onRegenerate && (
        <div className="flex justify-end">
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Regenerate notes with latest AI"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      )}

      {/* Key Points */}
      <div className="bg-gradient-to-br from-brand-50/50 to-accent-50/50 dark:from-brand-900/20 dark:to-accent-900/20 rounded-2xl p-8 border-2 border-brand-100/50 dark:border-brand-800 shadow-lg">
        <h3 className="text-2xl font-bold text-brand-900 dark:text-brand-300 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Key Points
        </h3>
        <ul className="space-y-4">
          {keyPoints.map((point, index) => (
            <li key={index} className="flex items-start group">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white text-base font-bold mr-4 mt-1 shadow-md group-hover:shadow-lg transition-shadow duration-150">
                {index + 1}
              </span>
              <div className="text-brand-900 dark:text-brand-100 leading-loose prose prose-brand dark:prose-invert max-w-none text-lg">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    p: ({ node, ...props }) => <span className="inline" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                    code: ({ node, ...props }) => (
                      <code
                        className="bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 px-2 py-1 rounded-lg text-sm font-mono shadow-sm"
                        {...props}
                      />
                    ),
                  }}
                >
                  {point}
                </ReactMarkdown>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Detailed Notes */}
      <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-8 border-2 border-blue-100 dark:border-gray-700 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Detailed Notes
        </h3>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              h1: ({ node, ...props }) => (
                <h1
                  className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4 pb-2 border-b-2 border-primary-500 dark:border-primary-400"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  className="text-2xl font-bold text-gray-900 dark:text-white mt-7 mb-3"
                  {...props}
                />
              ),
              h3: ({ node, ...props }) => (
                <h3
                  className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-2"
                  {...props}
                />
              ),
              h4: ({ node, ...props }) => (
                <h4
                  className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-2"
                  {...props}
                />
              ),
              p: ({ node, ...props }) => (
                <p
                  className="text-gray-700 dark:text-gray-300 leading-relaxed mb-5 text-base"
                  {...props}
                />
              ),
              ul: ({ node, ...props }) => (
                <ul
                  className="list-disc ml-6 space-y-2 mb-5 text-gray-700 dark:text-gray-300 marker:text-primary-500 dark:marker:text-primary-400"
                  {...props}
                />
              ),
              ol: ({ node, ...props }) => (
                <ol
                  className="list-decimal ml-6 space-y-2 mb-5 text-gray-700 dark:text-gray-300 marker:text-primary-500 dark:marker:text-primary-400"
                  {...props}
                />
              ),
              li: ({ node, ...props }) => <li className="leading-relaxed pl-2" {...props} />,
              strong: ({ node, ...props }) => (
                <strong className="font-bold text-gray-900 dark:text-white" {...props} />
              ),
              em: ({ node, ...props }) => (
                <em className="italic text-gray-800 dark:text-gray-200" {...props} />
              ),
              code: ({ node, className, children, ...props }) => {
                const isInline = !className;
                return isInline ? (
                  <code
                    className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-md text-sm font-mono border border-primary-200 dark:border-primary-800"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <code
                    className="block bg-gray-900 dark:bg-gray-950 text-gray-100 p-5 rounded-xl overflow-x-auto text-sm font-mono shadow-lg border border-gray-700 dark:border-gray-800 my-4"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 pl-6 pr-4 py-4 italic text-gray-700 dark:text-gray-300 my-5 rounded-r-lg"
                  {...props}
                />
              ),
              a: ({ node, ...props }) => (
                <a
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline decoration-primary-300 dark:decoration-primary-600 hover:decoration-primary-500 dark:hover:decoration-primary-400 transition-colors"
                  {...props}
                />
              ),
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-5">
                  <table
                    className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg"
                    {...props}
                  />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead className="bg-gray-100 dark:bg-gray-800" {...props} />
              ),
              tbody: ({ node, ...props }) => (
                <tbody
                  className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900"
                  {...props}
                />
              ),
              tr: ({ node, ...props }) => (
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  {...props}
                />
              ),
              th: ({ node, ...props }) => (
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider"
                  {...props}
                />
              ),
              td: ({ node, ...props }) => (
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300" {...props} />
              ),
              hr: ({ node, ...props }) => (
                <hr className="my-8 border-t-2 border-gray-300 dark:border-gray-700" {...props} />
              ),
            }}
          >
            {detailed}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
