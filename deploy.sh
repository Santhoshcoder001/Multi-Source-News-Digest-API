#!/bin/bash
set -e

echo "Starting News Digest API deployment validation..."

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo "Warning: backend/.env not found. Please ensure environment variables are set before starting containers."
fi

# Build and start the containers
echo "Building and starting Docker containers..."
docker-compose up -d --build

echo "Deployment initiated successfully."
echo "Use 'docker-compose ps' to view container status."
echo "Use 'docker-compose logs -f' to view logs."
