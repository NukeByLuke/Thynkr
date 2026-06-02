const fs = require("fs");
const path = "src/pages/ImmersiveStudy.tsx";
let content = fs.readFileSync(path, "utf-8");

// Add useState for notes
content = content.replace("function OriginalContentPreview({ file }: { file: UploadedFile }) {", 
  "function OriginalContentPreview({ file }: { file: UploadedFile }) {\n  const [showNotes, setShowNotes] = useState(false);\n  const [localNotes, setLocalNotes] = useState(() => localStorage.getItem('my-notes-' + file.id) || '');\n  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {\n    const val = e.target.value;\n    setLocalNotes(val);\n    localStorage.setItem('my-notes-' + file.id, val);\n  };"
);

// We need to inject the "saved notes" button in the Original Content header
const headerSearch = `<h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Original Content</h3>
          <div className="flex items-center gap-2">`;
const headerReplace = `<h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Original Content</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={\`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium border transition-colors \${localNotes.length > 0 ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-300' : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}\`}
            >
              <FileText className="w-3.5 h-3.5" />
              {showNotes ? 'Close Notes' : (localNotes.length > 0 ? 'Saved Notes' : 'Take Notes')}
            </button>`;
content = content.replace(headerSearch, headerReplace);

// We need to restructure the layout from single column to flex-row split wrapper
const structSearch = `return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">`;
const structReplace = `return (
    <div className="flex flex-col lg:flex-row gap-6 w-full min-h-[68vh]">
      <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full space-y-0 relative">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">`;
content = content.replace(structSearch, structReplace);

// Then we need to replace the `<div>` wrapper underneath the header with one that overflows nicely
content = content.replace(
  `        </div>
      <div>`,
  `        </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0 m-0">`
);

// Then append the second split column before the final `</div>` of the component
// Since we wrapped it in `<div className="flex flex-col lg:flex-row ...">`, the component ends with:
//         </div>
//       </div>
//     );
// We will replace that with:
const endSearch = `        </div>
      </div>
    );`;
const endReplace = `        </div>
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
  );`;
content = content.replace(endSearch, endReplace);

fs.writeFileSync(path, content);
console.log("Success string fix");
