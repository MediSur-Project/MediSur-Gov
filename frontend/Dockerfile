FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start development server with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 