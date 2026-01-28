# Thynkr Project Instructions

You are an expert full-stack developer working on "Thynkr", an AI-powered study platform.
Always adhere to the following rules, styles, and workflows.

## 1. Project Architecture & Deployment
- **Stack**: React (Vite) + Tailwind CSS (Frontend) | Node.js + Fastify (Backend).
- **Database**: PostgreSQL (Prisma ORM).
- **Deployment**: We deploy to **DigitalOcean** using Docker containers.
- **CI/CD**: Refer to `.github/workflows/deploy.yml`. When modifying build scripts or Dockerfiles, ensure compatibility with the DigitalOcean App Platform/Droplet environment defined there.

## 2. Design Philosophy: "Simple & Elegant"
- **Layout**: Minimize vertical space usage. Headers, navbars, and banners should be compact (`h-14` or `h-12` preferred over `h-16`).
- **Whitespace**: Use whitespace effectively but do not waste screen real estate.
- **Theme**: Use the **brand color scheme** that matches the logo and THYNKR branding:
  - **Light Mode**: Pink/Fuchsia/Orange gradients (sunrise/warm tones)
  - **Dark Mode**: Cyan/Violet/Blue gradients (midnight/cool tones)
  - **Primary Colors**: `brand` palette (pink-600, fuchsia-600, etc.) for light mode, cyan/violet for dark
  - **Backgrounds**: Subtle gradient backgrounds using brand colors
  - **Accents**: Use `accent` (cyan/blue) for highlights and borders
  - **DO NOT** use plain slate/zinc/gray for main UI elements - always incorporate the brand gradient colors
- **Simplicity**: Avoid cluttered UIs. Prefer clean lines and distinct actions.

## 3. Component Patterns
- **Uploads**: ALWAYS use the `UploadModal` component for file inputs. Never use a raw `<input type="file" />` directly in the page.
    - Users must always have the choice between **"Upload File"** and **"YouTube Link"**.
- **Buttons**: Use the shared `Button` or `IconButton` components found in `frontend/src/components/ui/`.
- **API**: Use the configured `api` instance from `@/lib/api` which handles JWT refresh automatically.

## 4. Coding Standards
- **Package Manager**: Always use `pnpm`.
- **Types**: Strict TypeScript. Avoid `any`.
- **Async**: Use `async/await` and proper error handling with `try/catch`.
- **State**: Use `TanStack Query` for server state and React Context for global UI state.

## 5. Mobile Responsiveness
- Ensure all layouts work on mobile.
- Use `hidden md:flex` patterns to simplify views on smaller screens rather than just shrinking everything.

## 6. Audio & TTS Implementation
- **Architecture**: OpenAI `tts-1` model streamed via Fastify backend (`/api/tts/stream`).
- **Client-Side Handling**: 
  - Audio speed is handled client-side using `playbackRate` to prevent unnecessary API calls/regeneration.
  - Duration is estimated (`text.length / 15`) for immediate UI feedback during streaming.
  - OS Media Controls are integrated via `navigator.mediaSession`.
- **UX Rules**: 
  - Changing voice regenerates audio but MUST resume from the previous timestamp.
  - Changing speed MUST be instant (client-side) and NOT regenerate audio.

## 7. File Organization
- **Root Directory**: Keep clean. config files only.
- **Documentation**: All guides, checklists, and setup info go in `docs/`.
- **Scripts**: DevOps and utility scripts go in `scripts/`.
- **Database**: SQL dumps and one-off scripts go in `backend/scripts/sql/`.