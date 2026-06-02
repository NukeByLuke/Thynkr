const fs = require('fs');
const path = 'src/pages/ImmersiveStudy.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\\r\\n/g, "\\n");

const exportFns = `  const handleExportDoc = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export Notes</title></head><body>";
    const footer = "</body></html>";
    const html = header + localNotes + footer;
    const blob = new Blob(['\\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = \`\${file.originalName.replace(/\\.[^/.]+$/, '')}_Notes.doc\`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Export PDF</title>');
    printWindow.document.write('<style>body { font-family: sans-serif; padding: 20px; color: black; background: white; } </style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(localNotes);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };`;

content = content.replace("  const handleQuillChange = (content: string) => {", exportFns + "\n\n  const handleQuillChange = (content: string) => {");

const dropdownStr = `            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hidden sm:inline-block">Auto-saves locally</span>
              
              <div className="relative group">
                <button className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Download className="w-3.5 h-3.5" />
                  Export
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </button>
                <div className="absolute right-0 mt-1 hidden w-40 flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl group-hover:flex z-[100]">
                  <button 
                    onClick={handleExportPdf}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    Export as PDF
                  </button>
                  <button 
                    onClick={handleExportDoc}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    Export to Google Docs
                  </button>
                </div>
              </div>
            </div>`;

content = content.replace('<span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Auto-saves locally</span>', dropdownStr);

if (!content.includes("ChevronDown,")) {
  content = content.replace("ChevronRight,", "ChevronRight,\\n  ChevronDown,");
}

fs.writeFileSync(path, content);
console.log("Re-applied correctly.");
