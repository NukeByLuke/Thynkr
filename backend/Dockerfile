# ============================================
# Multi-stage build for production optimization
# ============================================

# Stage 1: Dependencies
FROM node:22-slim AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install build tools for native deps (e.g., argon2)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies and force native rebuilds (argon2)
RUN pnpm install --no-frozen-lockfile && pnpm rebuild argon2 || pnpm rebuild argon2

# Stage 2: Builder
FROM node:22-slim AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build TypeScript with optimized memory settings
RUN NODE_OPTIONS="--max-old-space-size=2048" pnpm build

# Stage 3: Production runner
FROM node:22-slim AS runner
WORKDIR /app

# Install system dependencies: wget for healthcheck, openssl, ffmpeg for audio, yt-dlp for YouTube
RUN apt-get update && apt-get install -y --no-install-recommends \
  wget \
  openssl \
  ffmpeg \
  python3 \
  python3-pip \
  && pip3 install --break-system-packages --no-cache-dir yt-dlp \
  && rm -rf /var/lib/apt/lists/*

# Copy minimal metadata
COPY package.json pnpm-lock.yaml* ./

# Reuse node_modules from deps (includes Prisma CLI)
COPY --from=deps /app/node_modules ./node_modules
RUN chown -R node:node /app/node_modules

# Copy Prisma schema and generate client for target platform
COPY prisma ./prisma
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Create uploads directory with proper permissions
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Use non-root user for security
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --spider -q http://localhost:3001/health || exit 1

# Start server directly (database schema managed separately via db push)
CMD ["node", "dist/index.js"]

