const fs = require("fs");
const path = "src/pages/ImmersiveStudy.tsx";
let content = fs.readFileSync(path, "utf-8");

// Get the return block for OriginalContentPreview
const oldReturn = `    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Original Content</h3>
          <div className="flex items-center gap-2">
            {openTargetUrl && (
              <button
                onClick={openOriginal}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Original
              </button>
            )}
            {canDownload && (
              <button
                onClick={downloadFile}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            )}
          </div>
        </div>
        <div>
          {youtubeEmbedUrl ? (
            <iframe
              title="YouTube original content"
              src={youtubeEmbedUrl}
              className="w-full min-h-[52vh] sm:min-h-[68vh] border-0 bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : isWebLink && sourceUrl ? (
            <div className="space-y-3">
              <iframe
                title="Web page original content"
                src={sourceUrl}
                className="w-full min-h-[52vh] sm:min-h-[68vh] border-0 bg-white dark:bg-slate-900"
                sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                referrerPolicy="no-referrer"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
                If the page looks blank, the source site blocks embedding. Use Open Original to view it directly.
              </p>
            </div>
          ) : officeViewerUrl ? (
            <div className="space-y-3">
              <iframe
                title="Office document preview"
                src={officeViewerUrl}
                className="w-full min-h-[52vh] sm:min-h-[68vh] border-0 bg-white dark:bg-slate-900"
                referrerPolicy="no-referrer"
              />
              {isPowerPoint && (
                <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
                  PowerPoint is rendered through Office Web Viewer so you can browse all slides.
                </p>
              )}
            </div>
          ) : isPdf && previewFileUrl ? (
            <iframe
              title="PDF original content"
              src={previewFileUrl}
              className="w-full min-h-[52vh] sm:min-h-[68vh] border-0 rounded-b-3xl"
            />
          ) : isImage && previewFileUrl ? (
            <div className="flex min-h-[52vh] sm:min-h-[68vh] items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <img
                src={previewFileUrl}
                alt="Original content preview"
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
              />
            </div>
          ) : isAudioOrVideo && absolutePreviewFileUrl ? (
            <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <AudioTranscriptPlayer
                file={file}
                mediaUrl={absolutePreviewFileUrl}
                isAudio={fileType.startsWith('audio/')}
              />
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Original content unavailable"
              description="We couldn't render a preview for this file type yet. Use Open Original to view the source directly."
            />
          )}
        </div>
      </div>
    );`;

// Let me find exactly what is there so I can do a perfect index based replacement
