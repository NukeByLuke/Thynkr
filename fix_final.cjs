const fs = require("fs");
const path = "frontend/src/pages/ImmersiveStudy.tsx";
let content = fs.readFileSync(path, "utf-8");
content = content.replace(/\r\n/g, "\n");

const startStr = `  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">`;

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(`  );
}

type TranscriptCue`);

if (startIdx !== -1 && endIdx !== -1) {
  let newReturn = `  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full min-h-[68vh]">
      <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full space-y-0 relative">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Original Content</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={\`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium border transition-colors \${localNotes.length > 0 ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-300' : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}\`}
            >
              <FileText className="w-3.5 h-3.5" />
              {showNotes ? 'Close Notes' : (localNotes.length > 0 ? 'Saved Notes' : 'Take Notes')}
            </button>
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 m-0">
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
          ) : isAudio || isVideo ? (
            <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <AudioTranscriptPlayer
                file={file}
                mediaUrl={absolutePreviewFileUrl!}
                isAudio={isAudio}
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
      
      {showNotes && (
        <div className="flex-1 lg:max-w-md xl:max-w-lg min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col min-h-[60vh] h-full shadow-sm animate-fade-in relative">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Your Notes</h3>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Auto-saves locally</span>
          </div>
          <textarea 
            className="flex-1 w-full h-[50vh] lg:h-auto bg-transparent p-5 resize-none focus:outline-none text-slate-700 dark:text-slate-300 custom-scrollbar sm:text-lg leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-600"
            placeholder="Type your study notes here..."
            value={localNotes}
            onChange={handleNoteChange}
          />
        </div>
      )}
    </div>
`;
  content = content.substring(0, startIdx) + newReturn + content.substring(endIdx);
  
  if (!content.includes("const [showNotes, setShowNotes] = useState(false);")) {
    content = content.replace("function OriginalContentPreview({ file }: { file: UploadedFile }) {", "function OriginalContentPreview({ file }: { file: UploadedFile }) {\n  const [showNotes, setShowNotes] = useState(false);\n  const [localNotes, setLocalNotes] = useState(() => localStorage.getItem('my-notes-' + file.id) || '');\n  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {\n    const val = e.target.value;\n    setLocalNotes(val);\n    localStorage.setItem('my-notes-' + file.id, val);\n  };");
  }

  fs.writeFileSync(path, content);
  console.log("Success properly updated return");
} else {
  console.log("Could not find start or end bounds! Check CRLF logic.");
}
