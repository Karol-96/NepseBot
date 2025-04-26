FROM node:20-slim
WORKDIR /app

# Install Node.js dependencies and system packages
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    python3 \
    python3-pip \
    python3-dev \
    python3-venv \
    chromium \
    chromium-driver \
    xvfb \
    libgtk-3-0 \
    libdbus-glib-1-2 \
    libx11-xcb1 \
    libxt6 \
    libgl1-mesa-glx \
    libnss3 \
    libgbm1 \
    libasound2 \
    libglib2.0-0 \
    libfontconfig1 \
    libxcb-shm0 \
    libxcb-render0 \
    libxrender1 \
    libjpeg-dev

# Setup environment variables for headless Chrome
ENV PYTHONUNBUFFERED=1
ENV DISPLAY=:99
ENV SELENIUM_DISABLE_DEV_SHM=true

# Create and activate a Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy only manifests first
COPY package.json package-lock.json ./
COPY shared/package.json shared/

# Install your global CLIs
RUN npm install -g concurrently

# install exactly what's in package-lock (including devDeps)
RUN npm install --legacy-peer-deps
RUN npm rebuild esbuild --build-from-source

# Create directories for scraper
RUN mkdir -p captchas/original captchas/processed models

# Now bring in the rest of the code
COPY . .

# Install Python packages in the virtual environment
# Pin numpy to 1.24.3 to avoid version conflict with easyocr
RUN pip install --upgrade pip && \
    pip install --no-cache-dir numpy==1.24.3 && \
    pip install --no-cache-dir \
    selenium \
    opencv-python-headless \
    easyocr \
    torch==2.0.1 --extra-index-url https://download.pytorch.org/whl/cpu \
    torchvision==0.15.2 --extra-index-url https://download.pytorch.org/whl/cpu \
    pillow \
    requests

# Ensure the scraper script is executable
RUN chmod +x server/nepse-scraper.py

# Load your docker-specific env file
COPY .env.docker .env

EXPOSE 5173 5000

# Run exactly your local dev command
CMD ["npm", "run", "dev"]