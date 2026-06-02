const fs = require("fs");
const path = "src/pages/ImmersiveStudy.tsx";
let content = fs.readFileSync(path, "utf-8");
content = content.replace(/type TabType = 'original' \| 'my-notes' \| 'my-notes' \| 'summary' \| 'notes' \| 'flashcards' \| 'quizzes';/g, "type TabType = 'original' | 'summary' | 'notes' | 'flashcards' | 'quizzes';");
fs.writeFileSync(path, content);
console.log("Fixed TabType in ImmersiveStudy.tsx");
