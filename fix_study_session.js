const fs = require("fs");
const path = "frontend/src/hooks/useStudySession.ts";
let content = fs.readFileSync(path, "utf-8");

content = content.replace(
  /useState<'original' \| 'summary' \| 'notes' \| 'flashcards' \| 'quizzes'>/g,
  "useState<'original' | 'summary' | 'notes' | 'flashcards' | 'quizzes' | 'my-notes'>"
);

fs.writeFileSync(path, content);
console.log("Updated useStudySession.ts");
