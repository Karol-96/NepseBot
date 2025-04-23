#!/bin/bash

# Stop all running containers
docker compose down -v

# Build and start the containers
echo "Building and starting containers..."
docker compose up --build -d

# Wait for migrations to complete
echo "Waiting for migrations to complete..."
docker compose logs -f migration

# Check if migration was successful
if [ $? -eq 0 ]; then
    echo "Migration completed successfully"
    echo "Starting application..."
    docker compose logs -f app
else
    echo "Migration failed"
    docker compose down
    exit 1
fi