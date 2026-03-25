# Thynkr Copilot Instructions

You are an expert full-stack developer working on Thynkr, an AI-powered study platform.
Follow these rules for all work in this repository.

## 1. Canonical Domain Policy (Critical)

- Thynkr production domain is **thynkr.ca only**.
- Do not use `thynkr.study` for active app URLs, redirects, canonical links, env defaults, API bases, webhook targets, or docs examples.
- If you see `thynkr.study` in code or docs, treat it as legacy and update to `thynkr.ca` unless a migration/historical note explicitly requires both domains.
- For deployment checks and smoke tests, prefer `https://thynkr.ca`.

## 2. Architecture and Deployment

- Stack: React (Vite) + Tailwind CSS frontend, Node.js + Fastify backend.
- Database: PostgreSQL with Prisma ORM.
- Runtime: Docker containers on DigitalOcean.
- CI/CD compatibility: keep `.github/workflows/deploy.yml`, Dockerfiles, and deployment scripts aligned.
- Standard deployment path: use repository scripts under `scripts/` (especially `scripts/deploy-now.ps1` when asked to deploy now).

## 3. UI and Product Design

- Design direction: simple, elegant, compact.
- Keep vertical footprint tight (favor compact headers and controls).
- Use the Thynkr brand palette:
  - Light mode: pink/fuchsia/orange gradients.
  - Dark mode: cyan/violet/blue gradients.
  - Use brand/accent colors; avoid plain gray/slate-only main surfaces.
- Avoid clutter and oversized controls.

## 4. Frontend Implementation Rules

- Always use shared UI primitives from `frontend/src/components/ui/` when available.
- For uploads, use `frontend/src/components/modals/UploadModal.tsx`.
- Never add raw page-level file input flows that bypass the upload modal pattern.
- API calls must use `frontend/src/lib/api.ts` configured client.
- Ensure mobile responsiveness for all UI changes.
- Prefer `hidden md:flex` style simplifications on small screens over cramped scaling.

## 5. Backend and API Rules

- Use strict TypeScript and avoid `any`.
- Use async/await with explicit try/catch for failure-prone I/O.
- Keep validation and error responses consistent with existing route patterns.
- For server state interactions in frontend, use TanStack Query.

## 6. Audio and TTS Rules

- Architecture: OpenAI `tts-1` streamed from backend endpoint `/api/tts/stream`.
- Speed changes are client-side via `playbackRate` and must be instant.
- Voice changes may regenerate audio but must resume from prior timestamp.
- Keep media session integration intact for OS controls.

## 7. Repository Organization

- Keep root clean (top-level config and essential repo files only).
- Put docs in `docs/`.
- Put utility and deployment scripts in `scripts/`.
- Put DB one-off SQL scripts in `backend/scripts/sql/`.

## 8. Git and Delivery Workflow

- Use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Use feature/fix branches for scoped work.
- After requested code changes, validate builds/tests that are relevant and report results.

## 9. Terminal Usage Rules (Critical)

- Reuse the same terminal for sequential commands whenever possible.
- Default to foreground commands (`isBackground=false`).
- Use background terminals only for long-running processes (dev servers/watchers/long builds).
- Avoid opening many terminals for simple sequential tasks.
- In PowerShell command chains, use semicolons.
- Minimize hidden terminal clutter.

## 10. Decision Defaults

- If the user asks for deployment, use the standard project deployment script path unless they explicitly request a different method.
- If domain values are ambiguous, choose `thynkr.ca`.
- If legacy domain references are discovered during edits, normalize to `thynkr.ca` unless explicitly told not to.
