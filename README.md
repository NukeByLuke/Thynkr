# Thynkr - Full-Stack Membership Platform# Thynkr - Full-Stack Membership Platform

A production-ready membership platform with authentication, role-based access control, Stripe subscriptions, and modern UI.A modern, full-stack membership platform built with **React**, **TypeScript**, **Fastify**, **PostgreSQL**, **Prisma**, and **Stripe**. Features secure authentication, role-based access control, subscription management, and a beautiful UI.

## 🚀 Quick Start## 🚀 Features

### Prerequisites- **Authentication & Authorization**

- Node.js 18+ and pnpm - JWT-based authentication with access & refresh tokens

- Docker Desktop (for PostgreSQL) - Secure password hashing with Argon2

- Stripe account (for payments) - Email verification & password reset flows
  - Role-based access control (FREE, PRO, PREMIUM, ADMIN)

### 1. Automated Setup (Recommended)

```powershell- **Subscription Management**

# Clone and setup  - Stripe integration for payments

git clone <repository-url>  - Multiple subscription tiers

cd thynkr  - Webhook handling for subscription events

.\setup.ps1  - Customer portal for subscription management

```

- **Content Management**

### 2. Manual Setup - Role-gated content access

````powershell - Rich content library

# Install dependencies  - Admin panel for content CRUD

pnpm install  - Featured content support



# Setup environment- **Security**

cp .env.example .env  - Rate limiting

# Edit .env with your Stripe keys and JWT secrets  - CORS protection

  - Helmet security headers

# Start database  - Input validation with Zod

docker-compose up -d  - SQL injection prevention with Prisma



# Run migrations and seed- **Performance**

pnpm db:migrate  - Code splitting & lazy loading

pnpm db:seed  - React Query for data caching

  - Optimized images

# Start development servers  - Redis caching (optional)

pnpm dev

```- **Developer Experience**

  - TypeScript throughout

**Access the application:**  - ESLint & Prettier

- Frontend: http://localhost:5173  - Docker & Docker Compose

- Backend: http://localhost:3001  - Comprehensive testing setup

  - CI/CD with GitHub Actions

**Test accounts:**

- Free: `free@test.local` / `Password123!`## 📋 Tech Stack

- Pro: `pro@test.local` / `Password123!`

- Premium: `premium@test.local` / `Password123!`### Frontend

- Admin: `admin@test.local` / `AdminPass123!`- **React 18** - UI library

- **TypeScript** - Type safety

---- **Vite** - Build tool

- **TailwindCSS** - Styling

## 🏗️ Architecture- **React Router** - Routing

- **TanStack Query** - Data fetching & caching

### Tech Stack- **Zustand** - State management

**Backend:** Fastify, TypeScript, Prisma, PostgreSQL, Stripe  - **React Hook Form** - Form handling

**Frontend:** React 18, Vite, TypeScript, TailwindCSS, TanStack Query  - **Zod** - Validation

**DevOps:** Docker, pnpm workspaces, GitHub Actions

### Backend

### Project Structure- **Node.js** - Runtime

```- **TypeScript** - Type safety

thynkr/- **Fastify** - Web framework

├── backend/- **Prisma** - ORM

│   ├── src/- **PostgreSQL** - Database

│   │   ├── routes/        # API endpoints (auth, user, content, admin, stripe)- **Redis** - Caching (optional)

│   │   ├── middleware/    # Auth, error handling, validation- **Stripe** - Payments

│   │   ├── lib/           # JWT, logger, Stripe client- **Argon2** - Password hashing

│   │   ├── db/            # Prisma client, seed data- **JWT** - Authentication

│   │   └── index.ts       # Fastify server

│   └── prisma/## 🛠️ Prerequisites

│       └── schema.prisma  # Database models

├── frontend/- **Node.js** >= 18.0.0

│   ├── src/- **pnpm** >= 8.0.0

│   │   ├── components/    # Reusable UI components- **PostgreSQL** >= 14

│   │   ├── pages/         # Route pages- **Redis** (optional, for caching)

│   │   ├── contexts/      # Auth context- **Stripe Account** (test mode)

│   │   └── lib/           # API client

│   └── vite.config.ts## 🚦 Quick Start

└── docker-compose.yml

```> **💡 First time? See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed step-by-step instructions!**



---### Automated Setup (Recommended)



## 🎯 FeaturesIf you have Docker Desktop installed:



### Authentication & Security```powershell

- JWT access (15min) + refresh (7d) tokens with automatic rotation# Windows

- Argon2 password hashing.\setup.ps1

- Rate limiting (100 req/15min per IP)

- CORS, Helmet headers, Zod validation# Linux/Mac

./setup.sh

### Role-Based Access Control (RBAC)```

- **FREE** - Basic access

- **PRO** - Enhanced features ($9.99/month)This will automatically:

- **PREMIUM** - Full access ($29.99/month)- Install dependencies

- **ADMIN** - Administrative privileges- Start PostgreSQL & Redis

- Run migrations

### Stripe Integration- Seed test data

- Subscription checkout with customer portal

- Webhook handlers for automatic role syncing### Manual Setup

- Payment success/failure notifications

### 1. Clone and Install

### Admin Features

- User management with role changes```bash

- Content CRUD operations# Clone the repository

- System statisticsgit clone <repository-url>

- Audit loggingcd thynkr



---# Install dependencies

pnpm install

## 📡 API Endpoints```



### Authentication### 2. Environment Setup

````

POST /api/auth/register # Create account#### Backend Environment Variables

POST /api/auth/login # Login

POST /api/auth/refresh # Refresh tokensCopy `.env.example` to `.env` in the root:

POST /api/auth/logout # Logout

POST /api/auth/password-reset/\* # Password reset flow```bash

GET /api/auth/verify-email/:token # Verify emailcp .env.example .env

````



### UsersEdit `.env` with your values:

```

GET    /api/users/me                   # Get current user```env

PATCH  /api/users/me                   # Update profile# Database

```DATABASE_URL="postgresql://thynkr:thynkr_dev_password@localhost:5432/thynkr_db"



### Content# Redis (optional)

```REDIS_URL="redis://localhost:6379"

GET    /api/content                    # List content (role-filtered)

GET    /api/content/:slug              # Get single content# JWT Secrets (generate with: openssl rand -base64 32)

```JWT_ACCESS_SECRET="your-secret-here"

JWT_REFRESH_SECRET="your-refresh-secret-here"

### Admin (ADMIN role required)

```# Server

GET    /api/admin/users                # List all usersNODE_ENV="development"

PATCH  /api/admin/users/:id/role       # Change user rolePORT=3001

POST   /api/admin/content              # Create contentFRONTEND_URL="http://localhost:5173"

PATCH  /api/admin/content/:id          # Update content

DELETE /api/admin/content/:id          # Delete content# Stripe (get from https://dashboard.stripe.com/test/apikeys)

GET    /api/admin/logs                 # View audit logsSTRIPE_SECRET_KEY="sk_test_..."

GET    /api/admin/stats                # System statisticsSTRIPE_PUBLISHABLE_KEY="pk_test_..."

```STRIPE_WEBHOOK_SECRET="whsec_..." # Get from Stripe CLI or webhook settings



### Stripe# Stripe Price IDs (create products in Stripe Dashboard)

```STRIPE_PRICE_PRO_MONTHLY="price_..."

POST   /api/stripe/create-checkout-session  # Start subscriptionSTRIPE_PRICE_PRO_YEARLY="price_..."

POST   /api/stripe/create-portal-session    # Customer portalSTRIPE_PRICE_PREMIUM_MONTHLY="price_..."

POST   /api/stripe/webhook                  # Stripe webhooksSTRIPE_PRICE_PREMIUM_YEARLY="price_..."

````

---#### Frontend Environment Variables

## 🔧 Development```bash

cd frontend

### Available Scriptscp .env.example .env

`powershell`

pnpm dev # Start both servers

pnpm build # Build for productionEdit `frontend/.env`:

pnpm db:migrate # Run database migrations

pnpm db:seed # Seed test data```env

pnpm db:studio # Open Prisma StudioVITE_API_URL=http://localhost:3001/api

pnpm lint # Lint codeVITE*STRIPE_PUBLISHABLE_KEY=pk_test*...

pnpm format # Format with Prettier```

pnpm docker:up # Start Docker services

pnpm docker:down # Stop Docker services### 3. Start Database & Redis

````

```bash

### Environment Variables# Start PostgreSQL and Redis with Docker Compose

Copy `.env.example` to `.env` and configure:pnpm docker:up

```env

# Database# Or use your local installations

DATABASE_URL="postgresql://user:pass@localhost:5432/thynkr"```



# JWT (generate secure 64-char secrets)### 4. Database Setup

JWT_ACCESS_SECRET="your-secret-here"

JWT_REFRESH_SECRET="your-secret-here"```bash

# Generate Prisma Client

# Stripe (from dashboard.stripe.com)pnpm --filter backend db:generate

STRIPE_SECRET_KEY="sk_test_..."

STRIPE_WEBHOOK_SECRET="whsec_..."# Run migrations

STRIPE_PRO_PRICE_ID="price_..."pnpm db:migrate

STRIPE_PREMIUM_PRICE_ID="price_..."

# Seed database with test accounts

# Frontendpnpm db:seed

VITE_API_URL="http://localhost:3001"```

VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."

```### 5. Start Development Servers



### Database Schema```bash

- **User** - Authentication and profile# Start both frontend and backend

- **RefreshToken** - Token rotationpnpm dev

- **Subscription** - Stripe sync

- **Content** - Role-gated content# Or start individually:

- **AdminLog** - Audit trailpnpm dev:backend  # http://localhost:3001

pnpm dev:frontend # http://localhost:5173

---```



## 🚀 DeploymentVisit **http://localhost:5173** 🎉



### Production Build## 👥 Test Accounts

```powershell

# Build both appsThe seed script creates these test accounts:

pnpm build

| Email | Password | Role |

# Build Docker images|-------|----------|------|

docker build -t thynkr-backend ./backend| `free@test.local` | `Password123!` | FREE |

docker build -t thynkr-frontend ./frontend| `pro@test.local` | `Password123!` | PRO |

```| `premium@test.local` | `Password123!` | PREMIUM |

| `admin@test.local` | `AdminPass123!` | ADMIN |

### Environment Setup

1. Set production environment variables## 💳 Stripe Setup

2. Update CORS origins in `backend/src/index.ts`

3. Configure Stripe webhook endpoints### 1. Create Stripe Account

4. Set secure JWT secrets (64+ characters)

5. Enable SSL/TLS in production1. Sign up at https://stripe.com

2. Use **Test Mode** for development

### Security Checklist

- ✅ JWT secrets are cryptographically secure (64+ chars)### 2. Get API Keys

- ✅ Rate limiting enabled

- ✅ CORS restricted to frontend domain1. Go to https://dashboard.stripe.com/test/apikeys

- ✅ Helmet security headers configured2. Copy **Publishable key** and **Secret key**

- ✅ All inputs validated with Zod3. Add to your `.env` files

- ✅ Passwords hashed with Argon2

- ✅ SQL injection prevented (Prisma)### 3. Create Products & Prices

- ✅ Stripe webhook signature verification

- ⚠️ Enable HTTPS in production1. Go to https://dashboard.stripe.com/test/products

- ⚠️ Configure SendGrid for email2. Create products for Pro and Premium tiers

- ⚠️ Set up Sentry error tracking3. Add monthly and yearly prices

4. Copy price IDs to `.env`

---

### 4. Setup Webhooks (Local Development)

## 📊 Status & Roadmap

```bash

### ✅ Complete# Install Stripe CLI

- Full backend API (20+ endpoints)# https://stripe.com/docs/stripe-cli

- JWT authentication with refresh tokens

- RBAC with 4 membership tiers# Login to Stripe

- Stripe integration and webhooksstripe login

- Frontend auth flow and layout

- Landing, pricing, login pages# Forward webhooks to local backend

- Docker setup and CI/CDstripe listen --forward-to localhost:3001/api/stripe/webhook

- Database migrations and seeding

# Copy the webhook signing secret (whsec_...) to .env

### 🚧 In Progress (Stubs)```

- Library page (content grid)

- Account page (profile/subscription management)### Test Cards

- Admin dashboard (user/content management)

- Content detail page (markdown rendering)Use these cards in test mode:



### 🔮 Future Enhancements- **Success:** `4242 4242 4242 4242`

- Email notifications (SendGrid)- **Decline:** `4000 0000 0000 0002`

- Advanced search and filtering- **3D Secure:** `4000 0025 0000 3155`

- Content recommendations

- Analytics dashboardUse any future expiry date and any CVC.

- Mobile app (React Native)

## 🧪 Testing

---

```bash

## 🆘 Troubleshooting# Run all tests

pnpm test

**Port already in use:**

```powershell# Backend tests

# Change ports in .env:pnpm --filter backend test

PORT=3002              # Backendpnpm --filter backend test:watch

VITE_PORT=5174         # Frontend

```# Frontend tests

pnpm --filter frontend test

**Database connection failed:**pnpm --filter frontend test:watch

```powershell

# Restart Docker containers# E2E tests with Playwright

docker-compose downpnpm test:e2e

docker-compose up -dpnpm --filter frontend test:e2e:ui

pnpm db:migrate```

````

## 📦 Building for Production

**Prisma Client errors:**

`powershell`bash

# Regenerate client# Build both frontend and backend

cd backendpnpm build

pnpm prisma generate

````# Build individually

pnpm --filter backend build

**Build errors:**pnpm --filter frontend build

```powershell```

# Clean install

Remove-Item -Recurse -Force node_modules, backend/node_modules, frontend/node_modules## 🐳 Docker

pnpm install

```### Development



---```bash

# Start services

## 📄 Licensedocker-compose up -d



MIT License - see LICENSE file for details# Stop services

docker-compose down

---```



## 🤝 Contributing### Production



1. Fork the repository```bash

2. Create a feature branch (`git checkout -b feature/amazing-feature`)# Build images

3. Commit changes (`git commit -m 'Add amazing feature'`)docker build -f backend/Dockerfile -t thynkr-backend .

4. Push to branch (`git push origin feature/amazing-feature`)docker build -f frontend/Dockerfile -t thynkr-frontend .

5. Open a Pull Request

# Run containers

For issues or questions, please open an issue on GitHub.docker run -p 3001:3001 --env-file .env thynkr-backend

docker run -p 80:80 thynkr-frontend
````

## 🚀 Deployment

### Backend (API)

**Recommended Platforms:**

- Railway
- Render
- DigitalOcean App Platform
- Fly.io

**Steps:**

1. Create PostgreSQL database
2. Set environment variables
3. Deploy from GitHub
4. Run migrations: `pnpm db:migrate:prod`
5. Seed data: `pnpm db:seed`

### Frontend

**Recommended Platforms:**

- Vercel
- Netlify
- Cloudflare Pages

**Steps:**

1. Connect GitHub repository
2. Set build command: `pnpm build`
3. Set output directory: `dist`
4. Add environment variables
5. Deploy

### Environment Variables for Production

Ensure you set all required environment variables in your hosting platform:

- Update `DATABASE_URL` to production database
- Generate new JWT secrets
- Use Stripe **live mode** keys (not test mode)
- Update `FRONTEND_URL` to production domain
- Set `NODE_ENV=production`

## 📁 Project Structure

```
thynkr/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── config.ts           # Configuration
│   │   ├── index.ts            # Server entry point
│   │   ├── db/
│   │   │   ├── client.ts       # Prisma client
│   │   │   └── seed.ts         # Seed script
│   │   ├── lib/
│   │   │   ├── jwt.ts          # JWT utilities
│   │   │   ├── logger.ts       # Logger setup
│   │   │   └── stripe.ts       # Stripe client
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── error-handler.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── content.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   └── stripe.routes.ts
│   │   ├── schemas/
│   │   │   └── validation.schemas.ts
│   │   └── services/
│   │       └── auth.service.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── lib/
│   │   │   └── api.ts         # API client
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Pricing.tsx
│   │   │   ├── Library.tsx
│   │   │   ├── ContentDetail.tsx
│   │   │   ├── Account.tsx
│   │   │   ├── Admin.tsx
│   │   │   └── NotFound.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI
├── docker-compose.yml
├── .env.example
├── .gitignore
├── .prettierrc
├── package.json
└── README.md
```

## 🔐 Security Best Practices

- ✅ Passwords hashed with Argon2
- ✅ JWT with access & refresh tokens
- ✅ Refresh token rotation
- ✅ Rate limiting on auth endpoints
- ✅ Input validation with Zod
- ✅ SQL injection prevention with Prisma
- ✅ CORS configured
- ✅ Security headers with Helmet
- ✅ Environment variables for secrets

## 🎯 Next Steps / TODOs

- [ ] Implement full Library page with content grid
- [ ] Add content detail page with markdown rendering
- [ ] Complete Account page with subscription management
- [ ] Build out Admin dashboard with analytics
- [ ] Add email service integration (SendGrid)
- [ ] Implement WebSocket for real-time admin notifications
- [ ] Add comprehensive E2E tests
- [ ] Add monitoring (Sentry integration)
- [ ] Implement SSR/SSG for landing page
- [ ] Add PWA support

## 📝 API Documentation

API runs on `http://localhost:3001`

### Auth Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/password-reset/request` - Request password reset
- `POST /api/auth/password-reset/confirm` - Confirm password reset
- `GET /api/auth/verify-email/:token` - Verify email

### User Endpoints

- `GET /api/users/me` - Get current user (protected)
- `PATCH /api/users/me` - Update profile (protected)

### Content Endpoints

- `GET /api/content` - List content (protected)
- `GET /api/content/:slug` - Get content by slug (protected)

### Admin Endpoints (Admin only)

- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/:id/role` - Update user role
- `POST /api/admin/content` - Create content
- `PATCH /api/admin/content/:id` - Update content
- `DELETE /api/admin/content/:id` - Delete content
- `GET /api/admin/logs` - Get admin logs
- `GET /api/admin/stats` - Get statistics

### Stripe Endpoints

- `POST /api/stripe/create-checkout-session` - Create checkout (protected)
- `POST /api/stripe/create-portal-session` - Create portal (protected)
- `POST /api/stripe/webhook` - Stripe webhook handler

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 💬 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using modern web technologies**
