# Stage 1: Build
FROM node:22.21.0-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Stage 2: Production
FROM node:22.21.0-alpine

WORKDIR /usr/src/app

# Install git (and python/pip if aider runs directly in this environment)
RUN apk add --no-cache git python3 py3-pip

# Copy node_modules and package definitions
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./

# Copy all necessary root JavaScript files for the bot
COPY --from=builder /usr/src/app/*.js ./

# Copy specific directories if they exist (uncomment if you have a src folder)
# COPY --from=builder /usr/src/app/src ./src

# Set up non-root user for standard security
RUN addgroup -S botgroup && adduser -S botuser -G botgroup
USER botuser

# Keep the process alive
CMD ["node", "index.js"]
