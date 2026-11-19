# =============================================
# Stage 1: Install dependencies
# =============================================
# Chainguard zero-CVE base (Docker Scout: 0C 0H 0M 0L)
FROM cgr.dev/chainguard/node:latest-dev AS deps

WORKDIR /app

USER root

# Install bun for fast dependency resolution
RUN npm install -g --allow-scripts=bun bun

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# =============================================
# Stage 2: Build the application
# =============================================
FROM cgr.dev/chainguard/node:latest-dev AS builder

WORKDIR /app

USER root

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
# Stage 3: Production runner (distroless — 0 CVEs)
# =============================================
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
