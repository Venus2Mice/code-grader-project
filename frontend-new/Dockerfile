FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files ONLY (for layer caching)
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy app files
COPY . .

# Build Next.js app
RUN pnpm run build

# ====== PRODUCTION STAGE ======
FROM node:18-alpine AS runner

WORKDIR /app

# Install pnpm for start script
RUN npm install -g pnpm

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start Next.js production server
CMD ["pnpm", "start"]
