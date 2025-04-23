FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package.json ./shared/package.json

# Install dependencies including concurrently
RUN npm install -g concurrently && \
    npm install

# Copy project files
COPY . .

# Expose both the Vite and Express ports
EXPOSE 5173
EXPOSE 5000

# Start the application with host set
CMD ["npm", "run", "dev"]