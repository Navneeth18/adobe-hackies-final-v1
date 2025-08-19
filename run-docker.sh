#!/bin/bash

# Run script for the FastAPI + React application with Docker

# Add Docker to PATH
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

echo "Checking Docker status..."
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please:"
    echo "1. Open Docker Desktop from Applications"
    echo "2. Wait for it to start (whale icon in menu bar)"
    echo "3. Run this script again"
    exit 1
fi

echo "✅ Docker is running!"
echo "Starting FastAPI + React application..."
echo ""
echo "This will start:"
echo "- Frontend (React/Vite) on port 8080"
echo "- Backend (FastAPI) on port 8000"
echo "- MongoDB on port 27017"
echo ""

# Start the application using docker-compose
docker-compose up --build

echo ""
echo "Application stopped. To clean up containers and volumes, run:"
echo "docker-compose down -v"
