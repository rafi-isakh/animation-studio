FROM python:3.11

WORKDIR /app

# System dependencies for headless OpenGL rendering (pyrender/trimesh)
RUN apt-get update && apt-get install -y \
    libosmesa6-dev libgl1-mesa-dev \
    && rm -rf /var/lib/apt/lists/*
ENV PYOPENGL_PLATFORM=osmesa

# Copy and install dependencies first (for caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir --no-deps pyrender>=0.1.45

# Copy application code
COPY app/ ./app/
COPY scripts/ ./scripts/

# Default command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]