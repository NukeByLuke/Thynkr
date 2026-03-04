/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

  const detailedCards = useMemo(() => {
    const normalized = (detailed || '').trim();
    if (!normalized) {
      return [] as Array<{ title: string; content: string }>;
    }

    const sections = normalized
      .split(/\n(?=##\s+)/g)
      .map((section) => section.trim())
      .filter(Boolean);

    const source = sections.length > 0 ? sections : [normalized];

    return source.map((contentBlock, index) => {
      const headingMatch = contentBlock.match(/^##\s+(.+)$/m);
      const title = headingMatch?.[1]?.trim() || `Note Card ${index + 1}`;
      return {
        title,
        content: contentBlock,
      };
    });
  }, [detailed]);

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

      {/* Key Point Cards */}
      <div className="bg-gradient-to-br from-brand-50/50 to-accent-50/50 dark:from-brand-900/20 dark:to-accent-900/20 rounded-2xl p-5 sm:p-8 border-2 border-brand-100/50 dark:border-brand-800 shadow-lg">
        <h3 className="text-2xl font-bold text-brand-900 dark:text-brand-300 mb-5">Key Point Cards</h3>
        {keyPoints.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {keyPoints.map((point, index) => (
              <article
                key={index}
                className="rounded-xl border border-brand-200/70 dark:border-brand-700/60 bg-white/85 dark:bg-brand-950/20 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 text-white text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-brand-900 dark:text-brand-100">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{point}</ReactMarkdown>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">No key points generated yet.</p>
        )}
      </div>

      {/* Detailed Note Cards */}
      <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-5 sm:p-8 border-2 border-blue-100 dark:border-gray-700 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">Detailed Note Cards</h3>
        {detailedCards.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {detailedCards.map((card, index) => (
              <article
                key={`${card.title}-${index}`}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 p-4 sm:p-5"
              >
                <h4 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3">{card.title}</h4>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: () => null,
                      p: ({ node, ...props }) => (
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed mb-3" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc ml-5 space-y-1.5 mb-3 marker:text-fuchsia-500" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal ml-5 space-y-1.5 mb-3 marker:text-fuchsia-500" {...props} />
                      ),
                      code: ({ node, className, children, ...props }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code
                            className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-xs font-mono"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <code
                            className="block bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs font-mono my-2"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {card.content}
                  </ReactMarkdown>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">No detailed notes generated yet.</p>
        )}
      </div>
    </div>
  );
}
