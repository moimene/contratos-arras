#!/bin/sh
# Startup script for Railway - replaces $PORT in nginx config
# Railway dynamically assigns PORT environment variable

# Default to port 80 if PORT not set (for local testing)
export PORT=${PORT:-80}

# Replace $PORT in the nginx config template
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Starting nginx on port $PORT..."

# Start nginx
exec nginx -g 'daemon off;'
