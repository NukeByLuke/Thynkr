/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { RefreshCw, Play, AlertTriangle } from 'lucide-react';
import AudioPlayer from '@/components/audio/AudioPlayer';

interface SummaryViewProps {
  content: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  error?: Error | null;
}

export default function SummaryView({ content, onRegenerate, isRegenerating, error }: SummaryViewProps) {
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  // Clean text for TTS (strip markdown formatting)
  const cleanTextForTTS = useMemo(() => {
    return content
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*/g, '') // Remove bold
      .replace(/\*/g, '') // Remove italic
      .replace(/`/g, '') // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .trim();
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
    <div className="max-w-none animate-fade-in space-y-6">
      {/* Docked Audio Player */}
      {showAudioPlayer && (
        <AudioPlayer 
          text={cleanTextForTTS} 
          docked 
          onClose={() => setShowAudioPlayer(false)}
          onPlayStart={() => {}} 
        />
      )}

      {/* Summary Content */}
      <div className="bg-gradient-to-br from-white to-brand-50/50 dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-lg border border-brand-100/50 dark:border-gray-700 p-10">
        <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-brand-200/50 dark:border-gray-700">
          <h3 className="text-3xl font-bold">
            <span className="hidden dark:block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-violet-500">
              Summary
            </span>
            <span className="block dark:hidden text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-fuchsia-600 to-fuchsia-700">
              Summary
            </span>
          </h3>
          <div className="flex items-center gap-3">
             <button
              onClick={() => setShowAudioPlayer(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-pink-600 to-fuchsia-600 dark:from-cyan-500 dark:to-violet-600 hover:opacity-90 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              <Play className="w-4 h-4 fill-current" />
              Play Audio
            </button>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-fuchsia-600 dark:text-violet-400 hover:text-fuchsia-700 dark:hover:text-violet-300 bg-fuchsia-50 dark:bg-violet-900/30 hover:bg-fuchsia-100 dark:hover:bg-violet-900/50 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mt-8 mb-6 pb-4 border-b-4 border-brand-500/20"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-8 mb-4 pl-4 border-l-4 border-pink-500 dark:border-cyan-500"
                  {...props}
                />
              ),
              h3: ({ node, ...props }) => (
                <h3
                  className="text-xl font-bold text-gray-800 dark:text-gray-200 mt-6 mb-3 flex items-center gap-2"
                  {...props}
                />
              ),
              h4: ({ node, ...props }) => (
                <h4
                  className="text-lg font-semibold text-brand-700 dark:text-brand-300 mt-5 mb-2"
                  {...props}
                />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-bold text-brand-700 dark:text-brand-300" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/10 p-4 rounded-r-lg italic text-gray-700 dark:text-gray-300 my-4 shadow-sm"
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
