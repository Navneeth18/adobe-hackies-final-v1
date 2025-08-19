#!/bin/bash

# Local development setup script (without Docker)

echo "🚀 Setting up local development environment..."

# Check if we're in the right directory
if [ ! -f "backend/main.py" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Please run this script from the adobe-hackies-final-v1 directory"
    exit 1
fi

# Setup backend
echo "📦 Setting up Python backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Go back to root
cd ..

# Setup frontend
echo "🎨 Setting up React frontend..."
cd frontend

# Install Node dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Build frontend for production
echo "Building React frontend..."
npm run build

# Go back to root
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To run the application:"
echo "1. Start the backend:"
echo "   cd backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "2. Your app will be available at: http://localhost:8000"
echo ""
echo "For development with hot reload:"
echo "   Backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "   Frontend: cd frontend && npm run dev"
echo "   (Frontend dev server: http://localhost:8080)"
