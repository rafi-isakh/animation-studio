# Mithril Backend - EC2 Deployment Guide

## What Changed

Your docker-compose setup is now split into 3 files:
- **docker-compose.yml** - Base config (shared across all environments)
- **docker-compose.override.yml** - Local dev (auto-loaded, has hot reload)
- **docker-compose.prod.yml** - Production (restart policies, localhost binding, workers)

## Local Development (on your laptop)

```bash
cd mithril-backend

# Start with hot reload (auto-loads override file)
docker compose up --build

# Your API will be at: http://localhost:8000
# Redis at: localhost:6379
```

## Production Deployment (on EC2)

### 1. Prepare the server

SSH into your EC2:
```bash
ssh ubuntu@<your-ec2-ip>
```

Create directory for mithril:
```bash
sudo mkdir -p /home/ubuntu/mithril-backend
sudo chown -R ubuntu:ubuntu /home/ubuntu/mithril-backend
cd /home/ubuntu
```

### 2. Get the code

Option A - Git clone (recommended):
```bash
git clone <your-repo-url> mithril-src
cd mithril-src/mithril-backend
```

Option B - Upload via SCP (from your laptop):
```bash
# From your laptop in the project root
scp -r mithril-backend ubuntu@<your-ec2-ip>:/home/ubuntu/
```

### 3. Configure environment

```bash
cd /home/ubuntu/mithril-backend  # or /home/ubuntu/mithril-src/mithril-backend

# Copy and edit .env
cp .env.example .env
nano .env
```

**Critical .env values to set:**
- `INTERNAL_SERVICE_SECRET` - Generate: `openssl rand -hex 32`
- `REDIS_URL=redis://redis:6379/0`
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Your service account JSON (escape quotes or use file path)
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret
- `AWS_REGION` - e.g., `us-east-1`
- `VIDEOS_BUCKET` - Your S3 bucket name
- `CLOUDFRONT_DOMAIN` - Your CloudFront domain
- `SORA_API_KEY` - Your Sora API key (if using)
- `GEMINI_API_KEY` - Your Gemini API key

### 4. Start mithril backend

```bash
# Build and start in production mode
docker compose -p mithril -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Check status
docker ps | grep mithril

# View logs
docker compose -p mithril logs -f --tail=100

# Test locally on EC2
curl http://127.0.0.1:18000/health
```

### 5. Configure Nginx

Create nginx site config:
```bash
sudo nano /etc/nginx/sites-available/mithril.stellai.pro
```

Paste the content from `nginx-config-example.conf` (adjust SSL cert paths to match your setup).

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/mithril.stellai.pro /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### 6. DNS Configuration

Add DNS A record:
- **Name:** `mithril.stellai.pro`
- **Type:** A
- **Value:** Your EC2 public IP

### 7. SSL Certificate

If using Let's Encrypt (certbot):
```bash
sudo certbot --nginx -d mithril.stellai.pro
sudo systemctl reload nginx
```

### 8. Security Group

In AWS Console → EC2 → Security Groups:
- **Allow inbound:** 80/443 (HTTP/HTTPS) from `0.0.0.0/0`
- **Allow inbound:** 22 (SSH) from your IP only
- **Block:** 5432, 6379, 8000, 9000, 18000 (don't expose these publicly)

### 9. Verify deployment

From your laptop:
```bash
curl https://mithril.stellai.pro/health
```

## Updating Production

```bash
# SSH to EC2
ssh ubuntu@<your-ec2-ip>

cd /home/ubuntu/mithril-backend  # or mithril-src/mithril-backend

# Pull latest code (if using git)
git pull

# Rebuild and restart
docker compose -p mithril -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Check logs
docker compose -p mithril logs -f --tail=50
```

## Scaling Workers (optional)

If you need more worker capacity:
```bash
docker compose -p mithril -f docker-compose.yml -f docker-compose.prod.yml up -d --scale worker=3
```

## Troubleshooting

### Check what's listening
```bash
sudo ss -lntup | grep -E ":18000|:6379"
```

### Check container logs
```bash
docker compose -p mithril logs api --tail=200
docker compose -p mithril logs worker --tail=200
docker compose -p mithril logs redis --tail=50
```

### Restart services
```bash
docker compose -p mithril -f docker-compose.yml -f docker-compose.prod.yml restart api
docker compose -p mithril -f docker-compose.yml -f docker-compose.prod.yml restart worker
```

### Stop everything
```bash
docker compose -p mithril down
```

## Security Hardening Checklist

- [ ] Changed all default secrets in `.env`
- [ ] Redis not published to `0.0.0.0` (only internal)
- [ ] API bound to `127.0.0.1:18000` (not `0.0.0.0`)
- [ ] Security group blocks database/redis ports
- [ ] HTTPS/TLS enabled via nginx
- [ ] Existing DB ports (5432, 6432) changed to `127.0.0.1:...` in toonyz compose files

## Port Summary

**Your EC2 ports:**
- `80/443` - Nginx (public)
- `8000` - toonyz-web (existing)
- `9000` - dev-toonyz-web (existing)
- `18000` - mithril-api (NEW, localhost only, nginx proxies to it)
- `5432/6432` - Postgres (existing, should be localhost only)
- `8080/8081` - Translation engines (existing)

**Nginx routing:**
- `stellai.pro` → `127.0.0.1:8000` (existing toonyz)
- `dev.stellai.pro` → `127.0.0.1:9000` (existing dev)
- `mithril.stellai.pro` → `127.0.0.1:18000` (NEW mithril backend)
