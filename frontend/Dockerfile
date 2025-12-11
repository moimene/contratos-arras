# Frontend Dockerfile for Railway
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . ./

# Build for production (VITE_API_URL will be injected at build time)
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config template (will be processed by startup.sh)
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Copy startup script
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

# Railway dynamically assigns PORT
EXPOSE ${PORT:-80}

# Use startup script to inject PORT variable
CMD ["/startup.sh"]
