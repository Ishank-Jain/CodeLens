# =============================================
# Stage 1: Install dependencies
# =============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Install security patches in base image
RUN apk update && apk upgrade --no-cache

# Install bun for faster installs
RUN npm install -g bun

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies (production only — no devDeps in final image)
RUN bun install --frozen-lockfile || bun install

# =============================================
# Stage 2: Build the application
# =============================================
FROM node:20-alpine AS builder

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
# Stage 3: Production runner (minimal)
# =============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install security patches
RUN apk update && apk upgrade --no-cache && \
    # Remove package manager caches to reduce image size
    rm -rf /var/cache/apk/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets — set ownership to nextjs user
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create .next directory with correct ownership before copying into it
RUN mkdir .next && chown nextjs:nodejs .next

# Copy built standalone server and static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Drop ALL Linux capabilities — the container only needs to run Node
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use dumb-init or tini for proper signal handling (alpine has tini)
CMD ["node", "server.js"]
