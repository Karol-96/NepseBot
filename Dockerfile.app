FROM node:20-slim

WORKDIR /app

# Install necessary tools
RUN apt-get update && apt-get install -y curl wget

# Copy package files
COPY package*.json ./
COPY shared/package.json ./shared/package.json

# Install dependencies with concurrently available globally
RUN npm install -g concurrently && npm install

# Copy all project files
COPY . .

# Update vite config to use the correct client/src path
RUN echo 'import { defineConfig } from "vite"; \n\
import react from "@vitejs/plugin-react"; \n\
import path from "path"; \n\
\n\
export default defineConfig({ \n\
  root: "./client", \n\
  plugins: [react()], \n\
  resolve: { \n\
    alias: { \n\
      "@": path.resolve(__dirname, "./client/src"), \n\
    }, \n\
  }, \n\
  server: { \n\
    host: "0.0.0.0", \n\
    port: 5173, \n\
    strictPort: true, \n\
    watch: { \n\
      usePolling: true, \n\
    }, \n\
  }, \n\
});' > vite.config.js

# Expose ports
EXPOSE 5173
EXPOSE 5000

# Start the app with specific dev:client command to point to client directory
CMD ["sh", "-c", "concurrently \"npm run dev:client -- --root=client\" \"npm run dev:server\""]