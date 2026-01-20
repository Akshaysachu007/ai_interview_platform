# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Build the frontend
RUN npm run build

# Install serve to serve the build
RUN npm install -g serve

# Expose frontend port (default Vite preview is 4173, change if needed)
EXPOSE 4173

# Start the frontend using serve
CMD ["serve", "-s", "dist", "-l", "4173"]
