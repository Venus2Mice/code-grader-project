FROM node:18-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files ONLY (for layer caching)
COPY package.json pnpm-lock.yaml ./

# Install dependencies (without frozen-lockfile to allow updates)
RUN pnpm install

# Copy app files
COPY . .

# Expose port
EXPOSE 3000

# Enable SWC for faster compilation (Next.js 13+)
ENV NEXT_TELEMETRY_DISABLED=1

# Start development server with optimizations
CMD ["pnpm", "dev"]
