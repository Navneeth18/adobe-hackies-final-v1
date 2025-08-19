# Quick Start Guide

## 🎯 Current Status
✅ Docker is installed  
✅ Dockerfiles created  
✅ FastAPI updated to serve React frontend  
⏳ Docker Desktop needs to be started  

## 🚀 Option 1: Docker (Recommended for Production)

### Start Docker Desktop
1. **Open Docker Desktop** from Applications folder
2. **Wait for startup** - look for whale icon in menu bar
3. **Run the build script:**
   ```bash
   cd adobe-hackies-final-v1
   ./build.sh
   ```

### If Docker is ready, run:
```bash
# Build and run production container
./build.sh
docker run -p 8000:8000 adobe-hackathon-app:latest

# OR for development with hot reload
docker-compose -f docker-compose.dev.yml up
```

**Access your app:** http://localhost:8000

## 🛠️ Option 2: Local Development (No Docker)

If Docker is taking time to start, test locally first:

```bash
cd adobe-hackies-final-v1
./run-local.sh
```

Then start the backend:
```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Access your app:** http://localhost:8000

## 📁 What Was Created

```
adobe-hackies-final-v1/
├── Dockerfile                 # Production multi-stage build
├── docker-compose.dev.yml     # Development environment
├── build.sh                   # Build script with Docker checks
├── run-local.sh              # Local development setup
├── .dockerignore             # Docker build optimization
├── DOCKER_SETUP.md           # Detailed Docker guide
├── QUICK_START.md            # This file
├── backend/
│   ├── main.py               # ✅ Updated to serve React frontend
│   ├── Dockerfile.dev        # Development backend container
│   └── ...
└── frontend/
    ├── Dockerfile.dev        # Development frontend container
    └── ...
```

## 🔧 Key Features Implemented

✅ **Multi-stage Docker build**  
✅ **Single production container**  
✅ **FastAPI serves React static files**  
✅ **React Router SPA support**  
✅ **Development docker-compose with hot reload**  
✅ **Port 8000 exposure**  
✅ **Uvicorn command as specified**  

## 🐛 Troubleshooting

### Docker not starting?
- Check Activity Monitor for Docker processes
- Restart Docker Desktop
- Try: `killall Docker && open /Applications/Docker.app`

### Build errors?
- Make sure you're in `adobe-hackies-final-v1` directory
- Check Docker Desktop is running (whale icon in menu bar)
- Try: `docker system prune` to clean cache

### Local setup issues?
- Make sure Python 3 and Node.js are installed
- Check: `python3 --version` and `node --version`

## 🎉 Next Steps

1. **Start Docker Desktop** (if using Docker)
2. **Run `./build.sh`** or **`./run-local.sh`**
3. **Access http://localhost:8000**
4. **Test your application!**

Your FastAPI + React app is now containerized and ready for production! 🚀
