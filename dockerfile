# Use a minimal Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your app
COPY . .

# Set environment variables
ENV NODE_ENV=production

# Expose the app port
EXPOSE 5001

# Start the app
CMD ["node", "server.js"]
