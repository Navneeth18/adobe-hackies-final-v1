# Docker Setup Guide - Separate Frontend & Backend Services

This guide will help you run the FastAPI + React application using Docker with separate services for frontend (port 8080) and backend (port 8000).

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- At least 4GB of available RAM
- Ports 8000, 8080, and 27017 available

### Run the Application

1. **Simple one-command start:**
   ```bash
   ./run-docker.sh
   ```

2. **Or manually with docker-compose:**
   ```bash
   docker-compose up --build
   ```

### Access the Application
- **Frontend (React):** http://localhost:8080
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **MongoDB:** localhost:27017

## Architecture

The application runs as three separate Docker services:

1. **Frontend Service** (Port 8080)
   - React application with Vite dev server
   - Hot reloading enabled for development
   - Communicates with backend via API calls

2. **Backend Service** (Port 8000)
   - FastAPI application
   - Serves API endpoints at `/api/v1/*`
   - Hot reloading enabled for development

3. **MongoDB Service** (Port 27017)
   - Database for document storage
   - Persistent data volume

## Environment Variables

The frontend automatically detects the backend URL:
- **Development:** `http://localhost:8000/api/v1`
- **Docker:** Uses `VITE_API_URL` environment variable

## Stopping the Application

- **Graceful stop:** Press `Ctrl+C` in the terminal
- **Force stop and cleanup:**
  ```bash
  docker-compose down -v
  ```

## Troubleshooting

### Port Conflicts
If ports are already in use:
```bash
# Check what's using the ports
lsof -i :8000
lsof -i :8080
lsof -i :27017

# Kill processes or modify docker-compose.yml ports
```

### Build Issues
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose up --build --force-recreate
```

### Container Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f mongo
```

## Development Features

- **Hot Reloading:** Both frontend and backend support live code changes
- **Volume Mounting:** Source code changes reflect immediately
- **Separate Services:** Frontend and backend can be developed independently
- **Database Persistence:** MongoDB data persists between container restarts

## Production Notes

For production deployment, consider:
- Using production builds instead of dev servers
- Setting up proper environment variables
- Configuring reverse proxy (nginx)
- Setting up SSL certificates
- Using Docker secrets for sensitive data

## File Structure

```
adobe-hackies-final-v1/
├── docker-compose.yml          # Main orchestration file
├── run-docker.sh              # Quick start script
├── frontend/
│   ├── Dockerfile             # Frontend container config
│   └── ...
├── backend/
│   ├── Dockerfile             # Backend container config
│   └── ...
└── .dockerignore              # Files to exclude from build
```
