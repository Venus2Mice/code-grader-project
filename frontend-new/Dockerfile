FROM node:18-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy app files
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npx", "pnpm", "dev"]
