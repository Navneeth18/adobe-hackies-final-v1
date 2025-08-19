# Docker Setup for FastAPI + React Application

This guide will help you dockerize and run your FastAPI + React (Vite) application.

## Prerequisites

### Install Docker

**macOS:**
```bash
# Install Docker Desktop
brew install --cask docker
# Or download from: https://www.docker.com/products/docker-desktop/
```

**Linux (Ubuntu/Debian):**
```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install -y docker.io docker-compose

# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker
```

**Windows:**
Download and install Docker Desktop from: https://www.docker.com/products/docker-desktop/

### Verify Installation
```bash
docker --version
docker-compose --version
```

## Project Structure

```
adobe-hackies-final-v1/
├── backend/
│   ├── main.py              # Updated to serve frontend
│   ├── requirements.txt
│   ├── Dockerfile.dev       # Development backend
│   └── ...
├── frontend/
│   ├── package.json
│   ├── Dockerfile.dev       # Development frontend
│   └── ...
├── Dockerfile               # Production multi-stage build
├── docker-compose.dev.yml   # Development environment
├── build.sh                 # Build script
└── .dockerignore           # Docker ignore file
```

## Production Build (Single Container)

### Build the Application
```bash
# Make build script executable (if not already)
chmod +x build.sh

# Build the production image
./build.sh
# OR manually:
docker build -t adobe-hackathon-app:latest .
```

### Run the Production Container
```bash
# Run the application
docker run -p 8000:8000 adobe-hackathon-app:latest

# Run in background
docker run -d -p 8000:8000 --name adobe-app adobe-hackathon-app:latest
```

The application will be available at: http://localhost:8000

## Development Environment (Separate Services)

### Start Development Services
```bash
# Start all services (backend, frontend, database)
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Development URLs
- **Frontend (Vite dev server):** http://localhost:8080
- **Backend API:** http://localhost:8000
- **MongoDB:** localhost:27017

### Stop Development Services
```bash
docker-compose -f docker-compose.dev.yml down

# Remove volumes (database data)
docker-compose -f docker-compose.dev.yml down -v
```

## Key Features

### Production Setup
- **Multi-stage build:** Builds React frontend first, then copies to Python backend
- **Single container:** Serves both frontend and API from one container
- **Static file serving:** FastAPI serves React build files
- **React Router support:** All routes fall back to index.html for SPA routing
- **Optimized:** Uses alpine/slim images for smaller size

### Development Setup
- **Hot reload:** Both frontend and backend support hot reloading
- **Separate services:** Frontend and backend run in separate containers
- **Volume mounting:** Source code changes reflect immediately
- **Database included:** MongoDB service for development

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using the port
   lsof -i :8000
   # Kill the process or use different ports
   ```

2. **Permission issues (Linux):**
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Build failures:**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker build --no-cache -t adobe-hackathon-app:latest .
   ```

4. **Frontend not loading:**
   - Check that the frontend build completed successfully
   - Verify the dist/ directory exists in the container
   - Check browser console for errors

### Useful Commands

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# View images
docker images

# Remove container
docker rm container_name

# Remove image
docker rmi image_name

# View container logs
docker logs container_name

# Execute command in running container
docker exec -it container_name bash
```

## Environment Variables

Create a `.env` file for environment-specific settings:

```env
# Database
MONGODB_URL=mongodb://mongo:27017/adobe_hackathon

# API Keys (add your actual keys)
GOOGLE_API_KEY=your_google_api_key
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_region

# Environment
ENVIRONMENT=production
```

## Next Steps

1. **Install Docker** using the instructions above
2. **Test the build** with `./build.sh`
3. **Run the application** with `docker run -p 8000:8000 adobe-hackathon-app:latest`
4. **Access your app** at http://localhost:8000

For development, use the docker-compose setup for the best experience with hot reloading.
