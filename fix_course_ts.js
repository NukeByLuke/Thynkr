const fs = require("fs");
const path = "frontend/src/pages/Courses.tsx";
let content = fs.readFileSync(path, "utf-8");

content = content.replace("function CreateCourseModal({ isOpen, onClose, isPremium }: CreateCourseModalProps) {", "function CreateCourseModal({ isOpen, onClose }: CreateCourseModalProps) {");
content = content.replace("  isPremium: boolean;\n", "");

fs.writeFileSync(path, content);
console.log("Fixed Courses.tsx");
