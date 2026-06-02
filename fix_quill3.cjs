const fs = require("fs");
const path = "frontend/src/pages/ImmersiveStudy.tsx";
let content = fs.readFileSync(path, "utf-8");

let newQuillEditor = `          <div className="flex-1 overflow-hidden custom-quill-container bg-transparent text-slate-700 dark:text-slate-300">
            <ReactQuill 
              theme="snow"
              value={localNotes}
              onChange={handleQuillChange}
              className="h-full flex flex-col"
              placeholder="Type your study notes here..."
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['clean']
                ]
              }}
            />
            <style>{\`
              .custom-quill-container .ql-toolbar {
                border: none;
                border-bottom: 1px solid rgba(148, 163, 184, 0.2);
                background: transparent;
                padding: 12px;
              }
              .dark .custom-quill-container .ql-toolbar .ql-stroke {
                stroke: #cbd5e1;
              }
              .dark .custom-quill-container .ql-toolbar .ql-fill {
                fill: #cbd5e1;
              }
              .dark .custom-quill-container .ql-toolbar .ql-picker {
                color: #cbd5e1;
              }
              .custom-quill-container .ql-container {
                border: none;
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                font-family: inherit;
                font-size: 1.125rem;
              }
              .custom-quill-container .ql-editor {
                flex: 1;
                overflow-y: auto;
                padding: 1.25rem;
              }
            \`}</style>
          </div>`;

const targetIndex = content.indexOf('<textarea \n            className="flex-1 w-full h-[50vh]');
if (targetIndex !== -1) {
  const endIndex = content.indexOf('/>', targetIndex);
  if (endIndex !== -1) {
    content = content.substring(0, targetIndex) + newQuillEditor + content.substring(endIndex + 2);
    fs.writeFileSync(path, content);
    console.log("Successfully replaced textarea.");
  }
}
