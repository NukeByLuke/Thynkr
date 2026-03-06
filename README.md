<div align="center">

# Thynkr

### AI-Powered Learning Platform

[![CI](https://github.com/NukeByLuke/Thynkr/actions/workflows/ci.yml/badge.svg)](https://github.com/NukeByLuke/Thynkr/actions/workflows/ci.yml)
[![CodeQL](https://github.com/NukeByLuke/Thynkr/actions/workflows/codeql.yml/badge.svg)](https://github.com/NukeByLuke/Thynkr/actions/workflows/codeql.yml)
[![Deploy](https://github.com/NukeByLuke/Thynkr/actions/workflows/deploy.yml/badge.svg)](https://github.com/NukeByLuke/Thynkr/actions/workflows/deploy.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-20232A?logo=react&logoColor=61DAFB)
![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)

</div>

## Overview
Thynkr transforms static study material into interactive learning experiences.

It ingests uploaded files, web links, and media sources, then generates study outputs like summaries, quizzes, and flashcards through AI workflows. The platform is built as a full-stack application with a modern React frontend and a Fastify API backend.

## Core Features
- AI study generation: summaries, flashcards, and quiz flows.
- Immersive study mode with keyboard-friendly interactions.
- File and source management for mixed learning inputs.
- Progress and engagement systems for sustained study habits.
- Role-aware product behavior for free and paid tiers.

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS + Framer Motion
- TanStack Query

### Backend
- Node.js + Fastify
- Prisma ORM
- PostgreSQL
- Redis

### Infrastructure
- Docker and Docker Compose
- Nginx reverse proxy
- DigitalOcean deployment target
- GitHub Actions CI/CD

## Project Structure
```text
thynkr/
	backend/
		prisma/
		src/
	frontend/
		src/
	scripts/
	.github/workflows/
	docker-compose.yml
	docker-compose.prod.yml
```

## Local Setup

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker Desktop

### 1) Install dependencies
```bash
pnpm install
```

### 2) Start local services
```bash
docker compose up -d postgres redis
```

### 3) Generate Prisma client
```bash
pnpm --filter backend db:generate
```

### 4) Run migrations
```bash
pnpm --filter backend db:migrate
```

### 5) Start app
```bash
pnpm dev
```

Frontend default: `http://localhost:5173`  
Backend default: `http://localhost:3001`

## Quality Commands
```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Deployment
Production deployment is orchestrated through Docker images and a remote compose stack.

Primary script:
```powershell
./scripts/deploy.ps1
```

Useful flags:
```powershell
./scripts/deploy.ps1 -Component frontend -SkipTests
./scripts/deploy.ps1 -Component backend
./scripts/deploy.ps1 -NoCache
```

## Security and Operations Notes
- Secrets are managed through environment variables and deployment secrets.
- CI is configured to run lint/build checks and conditionally run tests when suites exist.
- CodeQL scanning is enabled for JavaScript/TypeScript analysis.

## License
MIT (see `LICENSE`).
