# ─── Stage 1: deps ────────────────────────────────────────────────────────────
# Install production dependencies and compile native modules (better-sqlite3).
FROM node:20-alpine AS deps

# Build toolchain required by better-sqlite3 (node-gyp)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ─── Stage 2: builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy node_modules with the compiled native binary from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build env placeholders — real values injected at runtime via env/volume.
# NEXT_PUBLIC_* are embedded at build time; keep them empty here so the
# script tag is omitted in the built output (runtime injection via env works
# for server components that read process.env, but NOT for baked-in NEXT_PUBLIC_
# strings). Self-hosters who want Umami must set these vars and rebuild, or
# use the dev server. Acceptable trade-off for v1.
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Minimal runtime deps: libstdc++ is needed for the better-sqlite3 native addon
RUN apk add --no-cache libstdc++

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Default data paths — both point inside the /data volume
ENV DATABASE_PATH=/data/uplore.db
ENV UPLOADS_PATH=/data/uploads

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output (smallest possible set of files)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# The native better-sqlite3 addon must be present in node_modules at runtime
# (standalone output does NOT bundle .node files automatically).
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bindings ./node_modules/bindings
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

# /data will be a mounted volume — pre-create with correct ownership
RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
