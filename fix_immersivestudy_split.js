const fs = require("fs");
const path = "frontend/src/pages/ImmersiveStudy.tsx";
let content = fs.readFileSync(path, "utf-8");

// Change tabs back to not have "AI " prefix in shortLabel and label
const tabsRegex = /const TABS: \{([^]*?)\];/;
content = content.replace(tabsRegex, `const TABS: { id: TabType; label: string; shortLabel: string; icon: typeof BookOpen }[] = [
  { id: 'original', label: 'Original Content', shortLabel: 'Original', icon: FileText },
  { id: 'summary', label: 'Summary', shortLabel: 'Summary', icon: BookOpen },
  { id: 'notes', label: 'Notes', shortLabel: 'Notes', icon: FileText },
  { id: 'flashcards', label: 'Flashcards', shortLabel: 'Flashcards', icon: Layers },
  { id: 'quizzes', label: 'Quiz', shortLabel: 'Quiz', icon: Brain },
];`);

// Remove the `my-notes` case from `renderTabContent`
const myNotesStart = content.indexOf("case 'my-notes':");
if (myNotesStart !== -1) {
    const nextCase = content.indexOf("case 'original':", myNotesStart);
    if (nextCase !== -1) {
        content = content.substring(0, myNotesStart) + content.substring(nextCase);
    }
}

// Update `OriginalContentPreview` to be an interactive component with a split screen for notes
let originalContentFunc = content.match(/function OriginalContentPreview\(\{ file \}: \{ file: UploadedFile \}\) \{([\s\S]+?)\n\n  type TranscriptCue/);
if (originalContentFunc) {
    let oldFuncStr = originalContentFunc[0];
    
    // We will build a new string for this component
    let newFuncStr = `function OriginalContentPreview({ file }: { file: UploadedFile }) {
  const [showNotes, setShowNotes] = useState(false);
  const [localNotes, setLocalNotes] = useState(() => localStorage.getItem('my-notes-' + file.id) || '');
  
  const fileType = (file.fileType || '').toLowerCase();
  const extension = getFileExtension(file.originalName);
  const previewFileUrl = getPreviewFileUrl(file);
  const sourceUrl = getSourceUrl(file);
  const absolutePreviewFileUrl = previewFileUrl ? toAbsoluteUrl(previewFileUrl) : null;
  const isPowerPoint =
    fileType.includes('presentationml') ||
    fileType.includes('powerpoint') ||
    ['ppt', 'pptx', 'pps', 'ppsx'].includes(extension);

  const isWordOrExcel =
    fileType.includes('wordprocessingml') ||
    fileType.includes('msword') ||
    fileType.includes('spreadsheetml') ||
    fileType.includes('ms-excel') ||
    ['doc', 'docx', 'xls', 'xlsx'].includes(extension);

  const isPdf = fileType.includes('pdf') || extension === 'pdf';
  const isImage =
    fileType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(extension);
  const isAudioOrVideo = fileType.startsWith('audio/') || fileType.startsWith('video/');
  const isWebLink = fileType === 'x-url/link' && !!file.sourceUrl;
  const youtubeEmbedUrl = getYoutubeEmbedUrl(file);

  const officeViewerUrl =
    (isPowerPoint || isWordOrExcel) && absolutePreviewFileUrl
      ? \`https://view.officeapps.live.com/op/embed.aspx?src=\${encodeURIComponent(absolutePreviewFileUrl)}\`
      : null;

  const openOriginal = () => {
    const url = youtubeEmbedUrl || sourceUrl || absolutePreviewFileUrl;
    if (url) window.open(url, '_blank');
  };

  const downloadFile = (e: React.MouseEvent) => {
    e.preventDefault();
    if (file.downloadUrl) {
      window.open(toAbsoluteUrl(file.downloadUrl), '_blank');
    }
  };

  const openTargetUrl = youtubeEmbedUrl || sourceUrl || absolutePreviewFileUrl;
  const canDownload = !!file.downloadUrl;
  
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalNotes(val);
    localStorage.setItem('my-notes-' + file.id, val);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-[calc(100vh-14rem)] min-h-[600px]">
      <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
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
              className="w-full h-full border-0 bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : isWebLink && sourceUrl ? (
            <div className="w-full h-full">
              <iframe
                title="Web page original content"
                src={sourceUrl}
                className="w-full h-[calc(100%-2rem)] border-0 bg-white dark:bg-slate-900"
                sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                referrerPolicy="no-referrer"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 px-3 py-2 text-center border-t border-slate-100 dark:border-slate-800">
                If the page looks blank, the source site blocks embedding. Use Open Original to view it directly.
              </p>
            </div>
          ) : officeViewerUrl ? (
            <div className="w-full h-full">
              <iframe
                title="Office document preview"
                src={officeViewerUrl}
                className="w-full h-[calc(100%-2rem)] border-0 bg-white dark:bg-slate-900"
                referrerPolicy="no-referrer"
              />
              {isPowerPoint && (
                <p className="text-xs text-slate-500 dark:text-slate-400 px-3 py-2 text-center border-t border-slate-100 dark:border-slate-800">
                  PowerPoint is rendered through Office Web Viewer so you can browse all slides.
                </p>
              )}
            </div>
          ) : isPdf && previewFileUrl ? (
            <iframe
              title="PDF original content"
              src={previewFileUrl}
              className="w-full h-full border-0 rounded-b-3xl"
            />
          ) : isImage && previewFileUrl ? (
            <div className="flex h-full items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <img
                src={previewFileUrl}
                alt="Original content preview"
                className="max-w-full max-h-full object-contain rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
              />
            </div>
          ) : isAudioOrVideo && absolutePreviewFileUrl ? (
            <div className="p-6">
              <MediaTranscriptionPreview
                file={file}
                mediaUrl={absolutePreviewFileUrl}
                isAudio={fileType.startsWith('audio/')}
              />
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title="Original content unavailable"
                description="We couldn't render a preview for this file type yet. Use Open Original to view the source directly."
              />
            </div>
          )}
        </div>
      </div>
      
      {showNotes && (
        <div className="flex-1 lg:max-w-md xl:max-w-lg min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col h-full shadow-sm animate-fade-in">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Your Notes</h3>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Auto-saves locally</span>
          </div>
          <textarea 
            className="flex-1 w-full bg-transparent p-5 resize-none focus:outline-none text-slate-700 dark:text-slate-300 custom-scrollbar sm:text-lg leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-600"
            placeholder="Type your study notes here..."
            value={localNotes}
            onChange={handleNoteChange}
          />
        </div>
      )}
    </div>
  );
}

  type TranscriptCue`;
    
    content = content.replace(oldFuncStr, newFuncStr);
}

fs.writeFileSync(path, content);
console.log("Updated ImmersiveStudy.tsx for Note Editor split view next to original content");
