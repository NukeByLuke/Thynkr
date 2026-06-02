const fs = require("fs");
const path = "frontend/src/pages/ImmersiveStudy.tsx";
let content = fs.readFileSync(path, "utf-8");

if (!content.includes("import ReactQuill")) {
  content = content.replace("import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';", "import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';\nimport ReactQuill from 'react-quill';\nimport 'react-quill/dist/quill.snow.css';");
}

fs.writeFileSync(path, content);
