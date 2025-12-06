/* eslint-disable @typescript-eslint/no-unused-vars */
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RefreshCw } from 'lucide-react';

interface NotesViewProps {
  keyPoints: string[];
  detailed: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export default function NotesView({
  keyPoints,
  detailed,
  onRegenerate,
  isRegenerating,
}: NotesViewProps) {
  return (
    <div className="space-y-6">
      {/* Regenerate Button */}
      {onRegenerate && (
        <div className="flex justify-end">
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Regenerate notes with latest AI"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      )}

      {/* Key Points */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
        <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Key Points
        </h3>
        <ul className="space-y-3">
          {keyPoints.map((point, index) => (
            <li key={index} className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-sm font-semibold mr-3 mt-0.5">
                {index + 1}
              </span>
              <div className="text-blue-900 dark:text-blue-100 leading-relaxed prose prose-blue dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => <span className="inline" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                    code: ({ node, ...props }) => (
                      <code
                        className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded text-sm font-mono"
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
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
