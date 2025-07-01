#!/bin/bash

# Docker management script for Supaboard monorepo
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Check if Docker and Docker Compose are installed
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_status ".env file created. Please edit it with your configuration."
        else
            print_error ".env.example file not found. Please create .env manually."
            exit 1
        fi
    fi
}

# Start services in production mode
start_prod() {
    print_header "Starting Production Services"
    check_env
    docker-compose up -d
    print_status "Services started in production mode"
    print_status "Frontend: http://localhost:3103"
    print_status "API: http://localhost:3102"
}

# Start services in development mode
start_dev() {
    print_header "Starting Development Services"
    check_env
    docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d
    print_status "Services started in development mode"
    print_status "Frontend: http://localhost:3103"
    print_status "API: http://localhost:3102"
    print_status "PgAdmin: http://localhost:5050"
    print_status "Redis Commander: http://localhost:8081"
}

# Stop all services
stop() {
    print_header "Stopping All Services"
    docker-compose down
    docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml down 2>/dev/null || true
    print_status "All services stopped"
}

# Restart services
restart() {
    print_header "Restarting Services"
    stop
    sleep 2
    start_prod
}

# Show logs
logs() {
    if [ $# -eq 0 ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$1"
    fi
}

# Show service status
status() {
    print_header "Service Status"
    docker-compose ps
}

# Clean up everything
clean() {
    print_header "Cleaning Up Docker Resources"
    print_warning "This will remove all containers, volumes, and images for this project."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        stop
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_status "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Build images
build() {
    print_header "Building Docker Images"
    docker-compose build --no-cache
    print_status "Build completed"
}

# Run database migrations
migrate() {
    print_header "Running Database Migrations"
    docker-compose exec api bun run db:migrate:deploy
    print_status "Migrations completed"
}

# Seed database
seed() {
    print_header "Seeding Database"
    docker-compose exec api bun run db:seed
    print_status "Database seeded"
}

# Reset database
reset_db() {
    print_header "Resetting Database"
    print_warning "This will reset the database and lose all data."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose exec api bun run db:push
        print_status "Database reset completed"
    else
        print_status "Database reset cancelled"
    fi
}

# Show help
show_help() {
    cat << EOF
Usage: $0 [COMMAND]

Commands:
    start-prod      Start services in production mode
    start-dev       Start services in development mode (with hot reload)
    stop            Stop all services
    restart         Restart services
    logs [service]  Show logs (optionally for specific service)
    status          Show service status
    build           Build Docker images
    clean           Clean up all Docker resources
    migrate         Run database migrations
    seed            Seed database with initial data
    reset-db        Reset database (WARNING: destroys all data)
    help            Show this help message

Examples:
    $0 start-dev              # Start in development mode
    $0 logs api               # Show API logs
    $0 logs                   # Show all logs
    $0 migrate                # Run database migrations

Services:
    - client (Frontend): http://localhost:3103
    - api (Backend): http://localhost:3102
    - postgres (Database): localhost:5432
    - redis (Cache): localhost:6379
    - pgadmin (Dev only): http://localhost:5050
    - redis-commander (Dev only): http://localhost:8081

EOF
}

# Main script logic
main() {
    check_dependencies

    case "${1:-help}" in
        start-prod|prod)
            start_prod
            ;;
        start-dev|dev)
            start_dev
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        logs)
            logs "${2:-}"
            ;;
        status|ps)
            status
            ;;
        build)
            build
            ;;
        clean)
            clean
            ;;
        migrate)
            migrate
            ;;
        seed)
            seed
            ;;
        reset-db)
            reset_db
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"