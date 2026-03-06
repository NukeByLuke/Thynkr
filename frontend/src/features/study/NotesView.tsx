/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RefreshCw, AlertTriangle, Volume2 } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { sanitizeTextForTTS } from '@/utils/ttsText';

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

  const noteCards = useMemo(() => {
    const cards: Array<{ title: string; content: string }> = [];

    const cleanedKeyPoints = keyPoints
      .map((point) => point?.trim())
      .filter((point): point is string => Boolean(point));

    if (cleanedKeyPoints.length > 0) {
      cards.push({
        title: 'Quick Highlights',
        content: cleanedKeyPoints
          .map((point) => (point.startsWith('-') ? point : `- ${point}`))
          .join('\n'),
      });
    }

    const normalizedDetailed = (detailed || '').trim();
    if (!normalizedDetailed) {
      return cards;
    }

    const sections = normalizedDetailed
      .split(/\n(?=##\s+)/g)
      .map((section) => section.trim())
      .filter(Boolean);

    const source = sections.length > 0 ? sections : [normalizedDetailed];

    source.forEach((contentBlock, index) => {
      const headingMatch = contentBlock.match(/^##\s+(.+)$/m);
      const title = headingMatch?.[1]?.trim() || `Section ${index + 1}`;
      const contentWithoutHeading = contentBlock.replace(/^##\s+.+$/m, '').trim();

      cards.push({
        title,
        content: contentWithoutHeading || contentBlock,
      });
    });

    return cards;
  }, [detailed, keyPoints]);

  const { openAudioPlayer, closeAudioPlayer } = useAudioPlayer();

  const handleNoteAudioToggle = useCallback(
    (text: string) => {
      const cleanText = sanitizeTextForTTS(text);
      if (!cleanText) {
        return;
      }

      openAudioPlayer({
        text: cleanText,
        title: 'Notes Audio',
        autoPlay: true,
      });
    },
    [openAudioPlayer]
  );

  const handleRegenerateClick = useCallback(() => {
    closeAudioPlayer();
    onRegenerate?.();
  }, [closeAudioPlayer, onRegenerate]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Regenerate Button */}
      {onRegenerate && (
        <div className="flex justify-end">
          <button
            onClick={handleRegenerateClick}
            disabled={isRegenerating}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Regenerate notes with latest AI"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-5 sm:p-6">
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          <span className="text-brand-600 dark:text-brand-400">AI</span> Notes
        </h3>
      </div>

      {noteCards.length > 0 ? (
        <div className="space-y-5">
          {noteCards.map((card, index) => (
            <article
              key={`${card.title}-${index}`}
              className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <h4 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">{card.title}</h4>
                <button
                  onClick={() => handleNoteAudioToggle(`${card.title}. ${card.content}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 hover:text-cyan-800 dark:hover:text-cyan-200 bg-cyan-50 dark:bg-cyan-500/15 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 rounded-lg transition-colors disabled:opacity-50"
                  title="Open note card audio player"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Listen
                </button>
              </div>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: () => null,
                    h2: () => null,
                    h3: ({ node, ...props }) => (
                      <h5 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mt-5 mb-3" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3 text-base sm:text-lg" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        className="list-disc ml-5 sm:ml-6 space-y-2.5 mb-4 text-slate-600 dark:text-slate-300 marker:text-slate-500 dark:marker:text-slate-400"
                        {...props}
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        className="list-decimal ml-5 sm:ml-6 space-y-2.5 mb-4 text-slate-600 dark:text-slate-300 marker:text-slate-500 dark:marker:text-slate-400"
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="leading-relaxed text-base sm:text-lg" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong className="font-semibold text-slate-900 dark:text-slate-100" {...props} />
                    ),
                    code: ({ node, className, children, ...props }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code
                          className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          className="block bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs sm:text-sm font-mono my-2"
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
        <p className="text-sm text-slate-600 dark:text-slate-300">No notes generated yet.</p>
      )}
    </div>
  );
}
