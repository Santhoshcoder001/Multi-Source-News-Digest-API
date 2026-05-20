# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Production Run
FROM node:20-alpine
WORKDIR /app

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Run as non-root user
USER node

EXPOSE 3001
CMD ["node", "server.js"]
