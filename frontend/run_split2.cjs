const fs = require("fs");
const path = "src/pages/ImmersiveStudy.tsx";
let content = fs.readFileSync(path, "utf-8");

// Convert all CRLF to LF for reliable JS replace
content = content.replace(/\r\n/g, "\n");

// Add useState
if (!content.includes("const [showNotes, setShowNotes] = useState(false);")) {
  content = content.replace(
    "function OriginalContentPreview({ file }: { file: UploadedFile }) {", 
    "function OriginalContentPreview({ file }: { file: UploadedFile }) {\n  const [showNotes, setShowNotes] = useState(false);\n  const [localNotes, setLocalNotes] = useState(() => localStorage.getItem('my-notes-' + file.id) || '');\n  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {\n    const val = e.target.value;\n    setLocalNotes(val);\n    localStorage.setItem('my-notes-' + file.id, val);\n  };"
  );
}

const headerSearch = `<h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Original Content</h3>\n          <div className="flex items-center gap-2">`;
const headerReplace = `<h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Original Content</h3>\n          <div className="flex items-center gap-2">\n            <button\n              onClick={() => setShowNotes(!showNotes)}\n              className={\`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium border transition-colors \${localNotes.length > 0 ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-300' : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}\`}\n            >\n              <FileText className="w-3.5 h-3.5" />\n              {showNotes ? 'Close Notes' : (localNotes.length > 0 ? 'Saved Notes' : 'Take Notes')}\n            </button>`;
content = content.replace(headerSearch, headerReplace);

const structSearch = `  const canDownload = !!file.downloadUrl;\n\n  return (\n    <div className="space-y-4">\n      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">`;
const structReplace = `  const canDownload = !!file.downloadUrl;\n\n  return (\n    <div className="flex flex-col lg:flex-row gap-6 w-full min-h-[68vh]">\n      <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full space-y-0 relative">\n        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">`;
content = content.replace(structSearch, structReplace);

const divSearch = `          </div>\n        </div>\n        <div>`;
const divReplace = `          </div>\n        </div>\n        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 m-0">`;
content = content.replace(divSearch, divReplace);

const endSearch = `          )}\n        </div>\n      </div>\n    );`;
const endReplace = `          )}\n        </div>\n      </div>\n      \n      {showNotes && (\n        <div className="flex-1 lg:max-w-md xl:max-w-lg min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col min-h-[60vh] h-full shadow-sm animate-fade-in relative">\n          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">\n            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Your Notes</h3>\n            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Auto-saves locally</span>\n          </div>\n          <textarea \n            className="flex-1 w-full h-[50vh] lg:h-auto bg-transparent p-5 resize-none focus:outline-none text-slate-700 dark:text-slate-300 custom-scrollbar sm:text-lg leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-600"\n            placeholder="Type your study notes here..."\n            value={localNotes}\n            onChange={handleNoteChange}\n          />\n        </div>\n      )}\n    </div>\n  );`;
content = content.replace(endSearch, endReplace);

fs.writeFileSync(path, content);
console.log("CRLF normalized fix applied");
