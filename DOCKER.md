# 🐳 Docker Setup Guide

This guide covers running the Banking System with Docker in various configurations.

## 🚀 Quick Start

### Complete System (Recommended)
Run everything with one command:
```bash
make run-full
```

This starts:
- ✅ PostgreSQL database
- ✅ MongoDB database  
- ✅ RabbitMQ message queue
- ✅ API Gateway (Backend)
- ✅ Transaction Processor
- ✅ React Frontend

**Access URLs:**
- 📊 **Frontend Dashboard**: http://localhost:3000
- 🔌 **API Gateway**: http://localhost:8080
- 🐰 **RabbitMQ Management**: http://localhost:15672 (rabbit_user/rabbit_password)

## 📋 Available Commands

### 🎯 Main Commands
| Command | Description | Services Started |
|---------|-------------|-----------------|
| `make run-full` | Complete system | All services |
| `make run-backend` | Backend only | API + Databases + Queue |
| `make run-frontend` | Frontend only | React app (needs backend) |

### 🛑 Stop Commands
| Command | Description |
|---------|-------------|
| `make stop-full` | Stop complete system |
| `make stop-backend` | Stop backend services |
| `make stop-frontend` | Stop frontend service |

### 📊 Monitoring Commands
| Command | Description |
|---------|-------------|
| `make status` | Show status of all services |
| `make logs-full` | Show logs for complete system |
| `make logs-backend` | Show logs for backend |
| `make logs-frontend` | Show logs for frontend |
| `make health-check` | Check health of all services |

### 🧹 Cleanup Commands
| Command | Description |
|---------|-------------|
| `make clean-docker` | Remove all containers, volumes, images |
| `make clean` | Clean build artifacts |

## 🔧 Development Workflows

### 1. Full Stack Development
```bash
# Start everything
make run-full

# Check status
make status

# View logs
make logs-full

# Stop when done
make stop-full
```

### 2. Backend Development
```bash
# Start backend services
make run-backend

# Develop frontend locally
make run-frontend-dev

# Stop backend when done  
make stop-backend
```

### 3. Frontend Development
```bash
# Start backend
make run-backend

# Start frontend container
make run-frontend

# Or run frontend locally for hot reload
cd frontend && npm start
```

## 📁 Docker Compose Files

| File | Purpose | Services |
|------|---------|----------|
| `docker-compose.full.yml` | Complete system | All services |
| `docker-compose.backend.yml` | Backend only | API + Databases |
| `docker-compose.frontend.yml` | Frontend only | React app |
| `docker-compose.yml` | Original dev setup | Backend containers only |

## 🗄️ Database Setup

### PostgreSQL
- **Port**: 5432
- **Database**: banking_db
- **User**: banking_user
- **Password**: banking_password
- **Auto-initialization**: `scripts/init-postgres.sql`

### MongoDB
- **Port**: 27017
- **Database**: banking_logs
- **User**: mongo_user
- **Password**: mongo_password

### RabbitMQ
- **AMQP Port**: 5672
- **Management UI**: 15672
- **User**: rabbit_user
- **Password**: rabbit_password

## 🏥 Health Checks

All services include health checks:

```bash
# Check all services
make health-check

# Check individual service
curl http://localhost:8080/health    # API Gateway
curl http://localhost:3000/health    # Frontend
```

## 🔍 Troubleshooting

### Common Issues

**1. Port Conflicts**
```bash
# Check what's using ports
lsof -i :3000,8080,5432,27017,5672,15672

# Stop conflicting services
sudo systemctl stop postgresql mongodb
```

**2. Permission Issues**
```bash
# Fix Docker permissions
sudo chmod 666 /var/run/docker.sock
```

**3. Memory Issues**
```bash
# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory (8GB+)
```

**4. Build Issues**
```bash
# Clean and rebuild
make clean-docker
make docker-build
make run-full
```

### View Service Logs

```bash
# All services
make logs-full

# Specific service
make logs SERVICE=api-gateway
make logs SERVICE=frontend
make logs SERVICE=postgres
```

### Restart Service

```bash
# Restart specific service
make restart SERVICE=api-gateway
make restart SERVICE=frontend
```

## 🚀 Production Deployment

### Environment Variables

Create `.env` file:
```bash
# Database
POSTGRES_URL=postgres://user:password@host:5432/database
MONGODB_URL=mongodb://user:password@host:27017/database
RABBITMQ_URL=amqp://user:password@host:5672/

# API
PORT=8080
CORS_ORIGIN=https://yourdomain.com

# Frontend
REACT_APP_API_URL=https://api.yourdomain.com
```

### Production Commands

```bash
# Build for production
make docker-build

# Deploy
make deploy-prod
```

## 📊 Service Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│   API Gateway   │
│   (React)       │    │   (Go)          │
│   Port: 3000    │    │   Port: 8080    │
└─────────────────┘    └─────────────────┘
                              │
                              ├─────────────────┐
                              │                 │
                    ┌─────────────────┐  ┌─────────────────┐
                    │   PostgreSQL    │  │   Transaction   │
                    │   (Accounts)    │  │   Processor     │
                    │   Port: 5432    │  │   (Worker)      │
                    └─────────────────┘  └─────────────────┘
                              │                 │
                    ┌─────────────────┐  ┌─────────────────┐
                    │   MongoDB       │  │   RabbitMQ      │
                    │   (Logs)        │  │   (Queue)       │
                    │   Port: 27017   │  │   Port: 5672    │
                    └─────────────────┘  └─────────────────┘
```

## 🛠️ Advanced Usage

### Scale Services

```bash
# Scale transaction processors
docker compose -f docker-compose.full.yml up -d --scale transaction-processor=5
```

### Custom Networks

```bash
# Connect external services
docker network connect banking-network your-service
```

### Volume Management

```bash
# Backup database
docker run --rm -v banking-system_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore database
docker run --rm -v banking-system_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

## 💡 Tips

1. **Use specific commands** for your workflow (full/backend/frontend)
2. **Monitor logs** regularly with `make logs-*` commands
3. **Health check** services before debugging
4. **Clean resources** periodically with `make clean-docker`
5. **Use environment variables** for different environments

## 🆘 Getting Help

```bash
# Show all available commands
make help

# Check service status
make status

# View logs for debugging
make logs-full
```