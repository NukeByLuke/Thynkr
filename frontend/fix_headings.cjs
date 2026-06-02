const fs = require("fs");

let content = fs.readFileSync("src/features/study/FlashcardViewer.tsx", "utf-8");
content = content.replace(/(?:<><span className="text-brand-600 dark:text-brand-400">AI<\/span> )+\{title \|\| 'Flashcards'\}(?:<\/>)+/g, `<span className="text-brand-600 dark:text-brand-400">AI</span> {title || 'Flashcards'}`);
fs.writeFileSync("src/features/study/FlashcardViewer.tsx", content);

content = fs.readFileSync("src/features/study/QuizPlayer.tsx", "utf-8");
content = content.replace(/(?:<><span className="text-brand-600 dark:text-brand-400">AI<\/span> )+\{title \|\| 'Quiz'\}(?:<\/>)+/g, `<span className="text-brand-600 dark:text-brand-400">AI</span> {title || 'Quiz'}`);
fs.writeFileSync("src/features/study/QuizPlayer.tsx", content);

content = fs.readFileSync("src/features/study/SummaryView.tsx", "utf-8");
content = content.replace(/(?:><span className="text-brand-600 dark:text-brand-400">AI<\/span> )+Summary<\/h3>/g, `><span className="text-brand-600 dark:text-brand-400">AI</span> Summary</h3>`);
fs.writeFileSync("src/features/study/SummaryView.tsx", content);
console.log("Cleaned up AI prefixes");
