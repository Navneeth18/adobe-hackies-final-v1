# Frontend Dockerfile for React (Vite) application
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . ./

# Expose port
EXPOSE 8080

# Command to run the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]
