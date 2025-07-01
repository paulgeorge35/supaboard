# Docker Setup for Supaboard Monorepo

This repository includes Docker Compose configurations to run the entire monorepo with all required services.

## 🚀 Quick Start

### Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)

### 1. Clone and Setup Environment

```bash
# Copy environment variables
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

### 2. Run the Application

#### Production Mode
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

#### Development Mode (with hot reloading)
```bash
# Start in development mode
docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d

# View logs
docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml logs -f
```

## 📋 Services

### Core Services

| Service | Port | Description |
|---------|------|-------------|
| **client** | 3103 | Frontend application (React/Vite) |
| **api** | 3102 | Backend API (Node.js/Bun) |
| **postgres** | 5432 | PostgreSQL database |
| **redis** | 6379 | Redis cache and session store |

### Development Tools (dev mode only)

| Service | Port | Description |
|---------|------|-------------|
| **pgadmin** | 5050 | PostgreSQL web interface |
| **redis-commander** | 8081 | Redis web interface |

## 🔧 Configuration

### Required Environment Variables

The following variables are **required** for the application to work:

```bash
# Database (auto-configured for Docker)
DATABASE_URL=postgresql://postgres:supaboard_password@postgres:5432/supaboard
REDIS_URL=redis://redis:6379

# Authentication
JWT_SECRET=your-secure-jwt-secret-here
COOKIE_NAME=supaboard-auth

# App URLs
APP_DOMAIN=localhost:3103
VITE_API_URL=http://localhost:3102
VITE_APP_DOMAIN=localhost:3103
VITE_APP_URL=http://localhost:3103
```

### Optional Environment Variables

These are optional but enable additional features:

#### Google OAuth
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_SIGN_IN_CALLBACK_URL=http://localhost:3102/auth/google/signin/callback
GOOGLE_SIGN_UP_CALLBACK_URL=http://localhost:3102/auth/google/signup/callback
```

#### Cloudflare R2 Storage
```bash
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_ENDPOINT=https://your-public-endpoint.com
VITE_R2_PUBLIC_ENDPOINT=https://your-public-endpoint.com
```

## 🛠️ Development

### File Structure

```
.
├── docker-compose.yaml          # Production configuration
├── docker-compose.dev.yaml     # Development overrides
├── .env.example                 # Environment template
├── apps/
│   ├── api/
│   │   ├── Dockerfile          # Production API build
│   │   └── Dockerfile.dev      # Development API build
│   └── client/
│       ├── Dockerfile          # Production client build
│       └── Dockerfile.dev      # Development client build
└── packages/                    # Shared packages
```

### Development Workflow

1. **Hot Reloading**: Development mode automatically reloads on file changes
2. **Database Management**: Access PgAdmin at http://localhost:5050
3. **Redis Management**: Access Redis Commander at http://localhost:8081
4. **Debugging**: API debug port available on 9229

### Database Operations

```bash
# Run database migrations
docker-compose exec api bun run db:migrate:deploy

# Seed the database
docker-compose exec api bun run db:seed

# Reset database
docker-compose exec api bun run db:push

# Access PostgreSQL directly
docker-compose exec postgres psql -U postgres -d supaboard
```

### Logs and Debugging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f client

# Execute commands in containers
docker-compose exec api bash
docker-compose exec postgres psql -U postgres
```

## 🐛 Troubleshooting

### Common Issues

#### Port Conflicts
If ports are already in use, update the port mappings in `docker-compose.yaml`:
```yaml
ports:
  - "3104:3000"  # Change external port
```

#### Database Connection Issues
1. Ensure PostgreSQL is healthy: `docker-compose ps postgres`
2. Check database logs: `docker-compose logs postgres`
3. Verify DATABASE_URL in environment

#### API Health Check Failing
The API health check expects a `/health` endpoint. If this doesn't exist, remove the healthcheck or create the endpoint.

#### Build Failures
```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Performance Issues

#### Slow Builds
- Use `.dockerignore` to exclude unnecessary files
- Consider using bind mounts for development

#### Memory Usage
- Adjust Docker Desktop memory allocation
- Monitor with `docker stats`

## 🔒 Security Notes

### Production Deployment

1. **Change default passwords**: Update PostgreSQL and PgAdmin passwords
2. **Use secrets**: Store sensitive environment variables securely
3. **Network security**: Remove development tools and exposed ports
4. **SSL/TLS**: Configure HTTPS for production domains
5. **Backup strategy**: Implement database backups

### Environment Variables

Never commit `.env` files to version control. Use:
- Docker secrets for production
- Environment-specific `.env` files
- CI/CD variable injection

## 📊 Monitoring

### Health Checks

All services include health checks that report status:
```bash
docker-compose ps
```

### Logs

Structured logging is available for all services:
```bash
# Real-time logs
docker-compose logs -f --tail=100

# Export logs
docker-compose logs > app.log
```

## 🚢 Deployment

### Building for Production

```bash
# Build production images
docker-compose build

# Tag for registry
docker tag supaboard-api:latest your-registry/supaboard-api:latest
docker tag supaboard-client:latest your-registry/supaboard-client:latest

# Push to registry
docker push your-registry/supaboard-api:latest
docker push your-registry/supaboard-client:latest
```

### Environment-Specific Configs

Create environment-specific compose files:
- `docker-compose.staging.yaml`
- `docker-compose.production.yaml`

Use with: `docker-compose -f docker-compose.yaml -f docker-compose.production.yaml up -d`

## 📝 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Bun Documentation](https://bun.sh/docs)