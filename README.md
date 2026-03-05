<div align="center">

# Thynkr

### The AI-Powered Learning Ecosystem

[![CI Status](https://github.com/NukeByLuke/Thynkr/actions/workflows/ci.yml/badge.svg)](https://github.com/NukeByLuke/Thynkr/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://reactjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-000000.svg?logo=fastify)](https://www.fastify.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192.svg?logo=postgresql)](https://www.postgresql.org/)

**Thynkr transforms static study materials into interactive, gamified learning experiences using advanced AI.**

[Features](#-features) â€¢ [Tech Stack](#-tech-stack) â€¢ [Getting Started](#-getting-started) â€¢ [Workflow](#-development-workflow) â€¢ [Deployment](#-deployment)

</div>

---

## ðŸš€ Overview

Thynkr is an enterprise-grade EdTech platform that leverages OpenAI to parse PDFs, documents, and videos into structured study content. It features a **"Zen Mode"** immersive study interface, a comprehensive **gamification system** with tiered achievements, and a robust **subscription model** via Stripe.

**Live Demo:** [https://thynkr.ca](https://thynkr.ca)

---

## âœ¨ Features

### ðŸ§  Intelligent Study Engine

- **Smart Parsing:** Extracts text from PDFs, DOCX, PPTX, and YouTube videos
- **AI Content Generation:** Automatically creates Summaries, Bulleted Notes, Interactive Quizzes, and Flashcards
- **Immersive Mode:** A distraction-free "Zen Mode" interface with glassmorphic UI, keyboard navigation, and smooth transitions
- **Text-to-Speech:** Neural audio playback with OpenAI TTS for studying on the go

### ðŸ† Gamification & Progression

- **XP System:** Earn experience points for studying, streaks, quiz performance, and content generation
- **Tiered Achievements:** 6-tier system (Bronze â†’ Silver â†’ Gold â†’ Ruby â†’ Diamond â†’ Mastery) for long-term engagement
- **Achievement Notifications:** Beautiful animated popups with tier-specific colors and sounds
- **Study Streaks:** Daily activity tracking with visual indicators

### ðŸ“š Course Management

- **Instructor Marketplace:** Premium users can access curated course content
- **File Organization:** Drag-and-drop folders with batch operations
- **Secure File Delivery:** Token-based secure streaming for video/audio content
- **Progress Tracking:** Per-file and per-course completion analytics

### ðŸ’Ž Enterprise Architecture

- **SaaS Ready:** Full Stripe integration (Checkout, Customer Portal, Webhooks) with tiered access control
- **Role-Based Access:** BASIC, STANDARD, PREMIUM, and ADMIN tiers with feature gating
- **OAuth Support:** Google Sign-In integration alongside email/password auth
- **Aurora Design System:** Custom Tailwind CSS design system featuring glassmorphism, fluid animations, and dark mode

---

## ðŸ›  Tech Stack

### Frontend

| Technology          | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| **React 18**        | UI Framework with concurrent rendering           |
| **TypeScript 5.3**  | Type-safe development                            |
| **Vite**            | Lightning-fast build tooling                     |
| **Tailwind CSS**    | Utility-first styling with custom "Aurora" theme |
| **Framer Motion**   | GPU-accelerated animations                       |
| **TanStack Query**  | Server state management with caching             |
| **React Router v6** | Client-side routing with lazy loading            |

### Backend

| Technology        | Purpose                                      |
| ----------------- | -------------------------------------------- |
| **Node.js 20**    | JavaScript runtime                           |
| **Fastify 4.x**   | High-performance web framework               |
| **Prisma ORM**    | Type-safe database access                    |
| **PostgreSQL 16** | Primary data store                           |
| **Redis 7**       | Caching, sessions, and rate limiting         |
| **OpenAI API**    | GPT-4o for content generation, TTS for audio |

### Infrastructure

| Technology         | Purpose                                     |
| ------------------ | ------------------------------------------- |
| **Docker**         | Containerization with multi-stage builds    |
| **Docker Compose** | Local development orchestration             |
| **Nginx**          | Reverse proxy, SSL termination, compression |
| **DigitalOcean**   | Cloud hosting (Droplet + managed DNS)       |
| **GitHub Actions** | CI/CD pipeline                              |

---

## ðŸ— Architecture

```mermaid
graph TD
    Client["Frontend (React + Vite)"] -->|HTTPS| Nginx["Nginx Proxy"]
    Nginx -->|"Reverse Proxy"| API["Backend API (Fastify)"]
    API -->|Query| DB[("PostgreSQL")]
    API -->|Cache/Sessions| Redis[("Redis")]
    API -->|"AI Processing"| OpenAI["OpenAI API"]
    API -->|Billing| Stripe["Stripe API"]
    API -->|Storage| Uploads["File Storage"]
```

---

## ðŸš€ Getting Started

### Prerequisites

- **Node.js** 18+ (20 recommended)
- **pnpm** 8+
- **Docker** & **Docker Compose**
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/NukeByLuke/Thynkr.git
cd Thynkr
```

### 2. Automated Setup (Recommended) â­

We provide setup scripts that handle database creation, migrations, and configuration automatically:

**Windows (PowerShell):**

```powershell
.\setup.ps1
```

**Linux/macOS:**

```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:

- âœ… Check prerequisites
- âœ… Create environment files
- âœ… Install dependencies
- âœ… Start Docker services (PostgreSQL & Redis)
- âœ… **Create the database** (fixes common setup errors)
- âœ… Run Prisma migrations
- âœ… Generate Prisma Client

### 3. Configure Environment

Edit `.env` and add your API keys:

```env
# Required for AI features
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional for payment testing
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
```

### 4. Start Development Servers

```bash
pnpm dev
```

Services will be available at:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

### 5. Create an Admin User (Optional)

```bash
cd backend
node create-admin.js
```

---

### Manual Setup (Alternative)

If you prefer manual setup:

**1. Environment & Dependencies:**

```bash
# Copy environment templates
cp .env.example .env
cp frontend/.env.example frontend/.env

# Install dependencies
pnpm install
```

**2. Start Docker Services:**

```bash
docker-compose up -d postgres redis

# Wait for services to be ready
sleep 10
```

**3. Initialize Database:**

```bash
# Create the database (important!)
docker-compose exec postgres psql -U thynkr -c "CREATE DATABASE thynkr_db;"

# Run migrations
cd backend
pnpm prisma migrate dev
cd ..
```

**4. Start Development:**

```bash
pnpm dev
```

---

## ðŸ”§ Development Workflow

Thynkr includes custom PowerShell scripts to streamline development. These are available as pnpm scripts at the root:

### Create a New Feature Branch

```bash
pnpm feature:new <feature-name>
# Example: pnpm feature:new user-dashboard
# Creates: feature/user-dashboard
```

### Merge Feature to Develop

```bash
pnpm feature:merge
# Merges current feature branch into develop
```

### Create a Release

```bash
pnpm release <version>
# Example: pnpm release 1.2.0
# Runs checks, merges develop â†’ main, creates tag v1.2.0
```

### Deploy to Production

```bash
# Full deployment
.\scripts\deploy.ps1

# Quick deploy (skip tests)
.\scripts\deploy.ps1 -SkipTests

# Deploy specific component
.\scripts\deploy.ps1 -Component frontend
.\scripts\deploy.ps1 -Component backend

# Fresh build (no Docker cache)
.\scripts\deploy.ps1 -NoCache
```

### Rollback

```bash
.\scripts\rollback-deployment.ps1
```

---

## ðŸ“¦ Deployment

Thynkr is deployed on **DigitalOcean** using Docker containers with Nginx as a reverse proxy.

### Production Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                  DigitalOcean Droplet           â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”              â”‚
â”‚  â”‚   Nginx     â”‚â”€â”€â”‚  Frontend   â”‚              â”‚
â”‚  â”‚  (SSL/Gzip) â”‚  â”‚  (React)    â”‚              â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜              â”‚
â”‚         â”‚                                       â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”              â”‚
â”‚  â”‚   Backend   â”‚â”€â”€â”‚  PostgreSQL â”‚              â”‚
â”‚  â”‚  (Fastify)  â”‚  â”‚             â”‚              â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜              â”‚
â”‚         â”‚                                       â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                               â”‚
â”‚  â”‚    Redis    â”‚                               â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Deployment Pipeline

1. **Build:** Docker images built locally with multi-stage optimization
2. **Push:** Images pushed to Docker Hub
3. **Pull:** Server pulls latest images
4. **Deploy:** Docker Compose orchestrates container updates
5. **Migrate:** Prisma migrations run automatically
6. **Health Check:** Automated verification of all services

---

## ðŸ“ Project Structure

```
thynkr/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ prisma/           # Database schema & migrations
â”‚   â”‚   â””â”€â”€ schema.prisma
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ config/       # Environment configuration
â”‚       â”œâ”€â”€ lib/          # Shared utilities (logger, auth)
â”‚       â”œâ”€â”€ middleware/   # Auth, rate limiting, validation
â”‚       â”œâ”€â”€ routes/       # API route handlers
â”‚       â””â”€â”€ services/     # Business logic (AI, gamification)
â”œâ”€â”€ frontend/
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ components/   # Reusable UI components
â”‚       â”œâ”€â”€ contexts/     # React contexts (Auth, Theme, Layout)
â”‚       â”œâ”€â”€ features/     # Feature-specific modules
â”‚       â”œâ”€â”€ hooks/        # Custom React hooks
â”‚       â”œâ”€â”€ layouts/      # Page layouts (Dashboard, Public)
â”‚       â”œâ”€â”€ lib/          # Utilities (api client, helpers)
â”‚       â””â”€â”€ pages/        # Route page components
â”œâ”€â”€ scripts/              # DevOps automation (PowerShell)
â”œâ”€â”€ docker-compose.yml    # Local development
â”œâ”€â”€ docker-compose.prod.yml
â””â”€â”€ nginx.prod.conf
```

---

## ðŸ¤ Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `pnpm feature:new my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Run type check: `pnpm typecheck`
6. Submit a pull request

---

## ðŸ‘¥ The DVLPR Team

Built with â¤ï¸ by:

- **Luke** - Full Stack Development
- **Ivan** - Backend Architecture
- **Harshan** - Frontend & Design

---

## ðŸ“„ License

Â© 2025-2026 Thynkr. All rights reserved.

Licensed under the [MIT License](LICENSE).
