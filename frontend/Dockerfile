# ============================================
# Multi-stage build for optimized production
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build args for environment variables
ARG VITE_API_URL=/api
ARG VITE_PREVIEW_PASSWORD=
ARG VITE_STRIPE_PRICE_STANDARD_MONTHLY=
ARG VITE_STRIPE_PRICE_STANDARD_YEARLY=
ARG VITE_STRIPE_PRICE_PREMIUM_MONTHLY=
ARG VITE_STRIPE_PRICE_PREMIUM_YEARLY=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PREVIEW_PASSWORD=$VITE_PREVIEW_PASSWORD
ENV VITE_STRIPE_PRICE_STANDARD_MONTHLY=$VITE_STRIPE_PRICE_STANDARD_MONTHLY
ENV VITE_STRIPE_PRICE_STANDARD_YEARLY=$VITE_STRIPE_PRICE_STANDARD_YEARLY
ENV VITE_STRIPE_PRICE_PREMIUM_MONTHLY=$VITE_STRIPE_PRICE_PREMIUM_MONTHLY
ENV VITE_STRIPE_PRICE_PREMIUM_YEARLY=$VITE_STRIPE_PRICE_PREMIUM_YEARLY

# Build the app
RUN pnpm build

# Stage 3: Production with Nginx
FROM nginx:alpine AS runner

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config - use local config for development (no SSL)
ARG NGINX_CONFIG=nginx.local.conf
COPY ${NGINX_CONFIG} /etc/nginx/conf.d/default.conf

# No Basic Auth; the SPA handles a themed preview gate

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/ > /dev/null || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
