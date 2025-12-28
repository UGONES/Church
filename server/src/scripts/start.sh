#!/bin/bash
# church/server/src/scripts/start.sh

echo "🚀 Starting Church Application Server..."

# Load environment variables
if [ -f /app/.env ]; then
    export $(cat /app/.env | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables"
else
    echo "⚠️  No .env file found, using defaults"
fi

# Wait for MongoDB
echo "⏳ Waiting for MongoDB..."
while ! nc -z ${MONGO_HOST:-mongodb} ${MONGO_PORT:-27017}; do
    echo "⏳ MongoDB not ready yet..."
    sleep 2
done
echo "✅ MongoDB is ready!"

# Wait for Redis (if enabled)
if [ ! -z "$REDIS_URL" ]; then
    echo "⏳ Waiting for Redis..."
    while ! nc -z ${REDIS_HOST:-redis} ${REDIS_PORT:-6379}; do
        echo "⏳ Redis not ready yet..."
        sleep 2
    done
    echo "✅ Redis is ready!"
fi

# Create necessary directories
mkdir -p /app/uploads /app/logs /app/media

# Run database migrations if any
if [ -f /app/src/scripts/migrate.js ]; then
    echo "📊 Running database migrations..."
    node /app/src/scripts/migrate.js
fi

# Start the server
echo "🚀 Starting Node.js server..."
exec node /app/src/server.js