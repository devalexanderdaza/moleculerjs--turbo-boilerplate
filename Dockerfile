# Dockerfile
# Build stage
FROM node:20-alpine as builder

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine as production

# Set environment to production
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/services ./src/services

# Expose ports
EXPOSE 3000

# Set health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O - http://localhost:3000/api/health || exit 1

# Run the app
CMD ["node", "dist/index.js"]