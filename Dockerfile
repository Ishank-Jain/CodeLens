# =============================================
# Stage 1: Install dependencies
# =============================================
# Debian Bookworm slim — eliminates Alpine CVEs
FROM node:22-bookworm-slim AS deps

WORKDIR /app

# Security updates & dependencies for bun
RUN apt-get update && apt-get upgrade -y --no-install-recommends && \
    apt-get install -y --no-install-recommends unzip curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install bun for fast installs
RUN npm install -g bun

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# =============================================
# Stage 2: Build the application
# =============================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time env (Next.js needs public vars at build time)
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js
RUN npm run build

# =============================================
# Stage 3: Production runner (distroless — minimal attack surface)
# =============================================
# Distroless: no shell, no package manager, no OS utilities
# Near-zero CVEs
FROM gcr.io/distroless/nodejs22-debian12 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built assets from builder
COPY --from=builder --chown=65534:65534 /app/public ./public
COPY --from=builder --chown=65534:65534 /app/.next/standalone ./
COPY --from=builder --chown=65534:65534 /app/.next/static ./.next/static

# Run as nonroot user (built into distroless)
USER nonroot

EXPOSE 3000

CMD ["server.js"]
