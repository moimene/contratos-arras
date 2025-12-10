# Backend Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . ./

# Build TypeScript
RUN npm run build

# Expose port (Railway assigns PORT dynamically)
EXPOSE ${PORT:-4000}

# Start server
CMD ["npm", "start"]
