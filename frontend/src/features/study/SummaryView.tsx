/* eslint-disable @typescript-eslint/no-unused-vars */
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { RefreshCw, Volume2, StopCircle, Loader2 } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';

interface SummaryViewProps {
  content: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export default function SummaryView({ content, onRegenerate, isRegenerating }: SummaryViewProps) {
  const { isPlaying, isLoading, toggle } = useTTS();

  const handlePlayAudio = () => {
    // Strip markdown formatting for cleaner audio
    const cleanText = content
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*/g, '') // Remove bold
      .replace(/\*/g, '') // Remove italic
      .replace(/`/g, '') // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
      .trim();
    
    toggle(cleanText);
  };

  return (
    <div className="max-w-none animate-fade-in">
      <div className="bg-gradient-to-br from-white to-brand-50/50 dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-lg border border-brand-100/50 dark:border-gray-700 p-10">
        <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-brand-200/50 dark:border-gray-700">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">Summary</h3>
          <div className="flex items-center gap-3">
            {/* TTS Play Button */}
            <button
              onClick={handlePlayAudio}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              title={isPlaying ? 'Stop audio' : 'Play audio'}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <StopCircle className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              {isLoading ? 'Loading...' : isPlaying ? 'Stop' : 'Play Audio'}
            </button>
            
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                title="Regenerate summary with latest AI"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
            )}
          </div>
        </div>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              h1: ({ node, ...props }) => (
                <h1
                  className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-5 pb-3 border-b-2 border-brand-500 dark:border-brand-400"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  className="text-2xl font-bold text-gray-900 dark:text-white mt-7 mb-4"
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
                  className="text-gray-700 dark:text-gray-300 leading-loose mb-6 text-lg"
                  {...props}
                />
              ),
              ul: ({ node, ...props }) => (
                <ul
                  className="list-disc ml-7 space-y-3 mb-6 text-gray-700 dark:text-gray-300 marker:text-brand-500 dark:marker:text-brand-400"
                  {...props}
                />
              ),
              ol: ({ node, ...props }) => (
                <ol
                  className="list-decimal ml-7 space-y-3 mb-6 text-gray-700 dark:text-gray-300 marker:text-brand-500 dark:marker:text-brand-400"
                  {...props}
                />
              ),
              li: ({ node, ...props }) => <li className="leading-loose pl-2" {...props} />,
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
              pre: ({ node, ...props }) => <pre className="my-4" {...props} />,
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
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
