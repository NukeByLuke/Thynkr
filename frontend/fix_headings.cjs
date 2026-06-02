const fs = require("fs");

let content = fs.readFileSync("src/features/study/FlashcardViewer.tsx", "utf-8");
content = content.replace(/\{title \|\| 'Flashcards'\}/, `<><span className="text-brand-600 dark:text-brand-400">AI</span> {title || 'Flashcards'}</>`);
fs.writeFileSync("src/features/study/FlashcardViewer.tsx", content);
console.log("Updated FlashcardViewer heading");

content = fs.readFileSync("src/features/study/QuizPlayer.tsx", "utf-8");
content = content.replace(/\{title\}/, `<><span className="text-brand-600 dark:text-brand-400">AI</span> {title || 'Quiz'}</>`);
fs.writeFileSync("src/features/study/QuizPlayer.tsx", content);
console.log("Updated QuizPlayer heading");
