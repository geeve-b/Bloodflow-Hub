# Build stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --include=dev --include=optional
RUN npm i --no-save @rollup/rollup-linux-x64-gnu lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-bookworm-slim

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --include=optional && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application
CMD ["node", "dist/index.cjs"]
