#!/bin/bash

# Build script for the FastAPI + React application

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
echo "Building FastAPI + React application..."

# Build the production Docker image
docker build -t adobe-hackathon-app:latest .

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Build complete! You can now run the application with:"
    echo "docker run -p 8000:8000 adobe-hackathon-app:latest"
    echo ""
    echo "Or use docker-compose for development:"
    echo "docker-compose -f docker-compose.dev.yml up"
    echo ""
    echo "Your app will be available at: http://localhost:8000"
else
    echo "❌ Build failed. Check the error messages above."
    exit 1
fi
