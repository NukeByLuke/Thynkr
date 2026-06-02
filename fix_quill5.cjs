const fs = require("fs");
const path = "frontend/src/pages/ImmersiveStudy.tsx";
let content = fs.readFileSync(path, "utf-8");

if (!content.includes("import ReactQuill")) {
  content = content.replace("import { useEffect, useCallback, useRef, useState, useMemo } from 'react';", "import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';\nimport ReactQuill from 'react-quill';\nimport 'react-quill/dist/quill.snow.css';");
}

let handleNoteChangeStr = `  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalNotes(val);
    localStorage.setItem('my-notes-' + file.id, val);
  };`;

content = content.replace(handleNoteChangeStr, "");

fs.writeFileSync(path, content);
