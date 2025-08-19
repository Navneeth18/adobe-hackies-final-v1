# Docker Deployment Guide

This guide provides step-by-step instructions to run the Adobe Hackathon Document Insight Engine using Docker.

## 🚀 Quick Start

### Prerequisites
- Docker installed on your system
- Docker Compose installed
- At least 4GB of available RAM
- 10GB of free disk space

### 1. Clone and Navigate
```bash
git clone <your-repository-url>
cd adobe-hackies-final-v1
```

### 2. Environment Setup (Optional)
Create a `.env` file in the project root for API keys:
```bash
# Optional: Add your API keys for enhanced features
GOOGLE_API_KEY=your_google_api_key_here
AZURE_TTS_KEY=your_azure_tts_key_here
AZURE_TTS_REGION=eastus
```

### 3. Start the Application
```bash
# Start all services (app + database)
docker-compose up

# Or run in background
docker-compose up -d
```

### 4. Access the Application
- **Web Interface**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MongoDB**: localhost:27017

## 📋 Available Commands

### Basic Operations
```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
docker-compose logs -f mongo
```

### Rebuild and Update
```bash
# Rebuild and start (after code changes)
docker-compose up --build

# Force rebuild without cache
docker-compose build --no-cache
docker-compose up
```

### Data Management
```bash
# Stop and remove all data (CAUTION: This deletes your database)
docker-compose down -v

# Backup MongoDB data
docker-compose exec mongo mongodump --out /data/backup

# View container status
docker-compose ps
```

## 🏗️ Architecture

### Services
- **app**: FastAPI backend + React frontend (Port 8000)
- **mongo**: MongoDB database (Port 27017)

### Volumes
- `mongo_data`: Persistent MongoDB storage

### Networks
- `app-network`: Internal communication between services

## 🔧 Configuration

### Environment Variables
The application uses these environment variables (automatically configured):
- `MONGO_CONNECTION_STRING`: MongoDB connection URL
- `MONGO_DATABASE_NAME`: Database name (adobe)
- `PYTHONPATH`: Python module path

### Ports
- **8000**: Main application (FastAPI + React)
- **27017**: MongoDB database

## 📁 Project Structure
```
adobe-hackies-final-v1/
├── docker-compose.yml          # Production deployment
├── Dockerfile                  # Multi-stage build
├── backend/                    # FastAPI application
├── frontend/                   # React application
└── DOCKER_DEPLOYMENT.md        # This file
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 8000
lsof -i :8000

# Kill the process or change ports in docker-compose.yml
```

#### MongoDB Connection Issues
```bash
# Check if MongoDB is running
docker-compose ps

# View MongoDB logs
docker-compose logs mongo

# Restart services
docker-compose restart
```

#### Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### Out of Memory
```bash
# Check Docker memory usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
```

### Logs and Debugging
```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs app
docker-compose logs mongo

# Execute commands inside containers
docker-compose exec app bash
docker-compose exec mongo mongosh
```

## 🔒 Security Notes

### Production Deployment
For production use, consider:
- Adding authentication to MongoDB
- Using environment files for secrets
- Setting up reverse proxy (nginx)
- Enabling HTTPS
- Restricting network access

### Example Production Environment
```env
# .env.production
MONGO_CONNECTION_STRING=mongodb://username:password@mongo:27017
MONGO_DATABASE_NAME=adobe_prod
GOOGLE_API_KEY=your_production_api_key
AZURE_TTS_KEY=your_production_tts_key
AZURE_TTS_REGION=your_region
```

## 📊 Monitoring

### Health Checks
```bash
# Check application health
curl http://localhost:8000/docs

# Check MongoDB health
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"
```

### Resource Usage
```bash
# Monitor resource usage
docker stats

# View disk usage
docker system df
```

## 🛠️ Development

### Development Mode
For development with hot reload, use:
```bash
docker-compose -f docker-compose.dev.yml up
```

### Making Changes
1. Make your code changes
2. Rebuild and restart:
```bash
docker-compose up --build
```

## 📞 Support

### Getting Help
- Check logs: `docker-compose logs -f`
- Verify services: `docker-compose ps`
- Test connectivity: `curl http://localhost:8000`

### Clean Restart
If you encounter persistent issues:
```bash
# Stop everything
docker-compose down

# Remove volumes (CAUTION: Deletes data)
docker-compose down -v

# Clean Docker system
docker system prune -a

# Start fresh
docker-compose up --build
```

---

## 🎉 Success!

Once running, you should see:
- ✅ MongoDB connected and ready
- ✅ AI models loaded (Recommendation, Gemini, Azure TTS)
- ✅ Web interface accessible at http://localhost:8000
- ✅ API documentation at http://localhost:8000/docs

Your Adobe Hackathon Document Insight Engine is now running in Docker! 🚀
