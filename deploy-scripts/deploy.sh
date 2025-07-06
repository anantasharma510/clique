#!/bin/bash

# Deployment script for Synexis Clique
# Usage: ./deploy.sh [--rollback] [--force]

set -e

# Configuration
PROJECT_DIR="/root/shoponclique"
BACKUP_DIR="/root/backups"
LOG_FILE="/var/log/deployments.log"
MAX_BACKUPS=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error_exit "Please run as root"
fi

# Parse arguments
ROLLBACK=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            error_exit "Unknown option: $1"
            ;;
    esac
done

# Rollback function
rollback() {
    log "${YELLOW}Starting rollback...${NC}"
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/shoponclique.*.tar.gz 2>/dev/null | head -n 1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        error_exit "No backup found for rollback"
    fi
    
    log "Rolling back to: $LATEST_BACKUP"
    
    # Stop services
    pm2 stop backend frontend 2>/dev/null || true
    
    # Restore from backup
    rm -rf "$PROJECT_DIR"
    tar -xzf "$LATEST_BACKUP" -C /root/
    
    # Restart services
    cd "$PROJECT_DIR"
    pm2 start backend
    pm2 start frontend
    
    log "${GREEN}Rollback completed successfully!${NC}"
    exit 0
}

# Main deployment function
deploy() {
    log "${GREEN}Starting deployment...${NC}"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Create backup if project exists
    if [ -d "$PROJECT_DIR" ]; then
        log "Creating backup..."
        BACKUP_FILE="$BACKUP_DIR/shoponclique.$(date +%Y%m%d_%H%M%S).tar.gz"
        tar -czf "$BACKUP_FILE" -C /root shoponclique
        log "Backup created: $BACKUP_FILE"
        
        # Cleanup old backups
        ls -t "$BACKUP_DIR"/shoponclique.*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
    fi
    
    # Navigate to project directory
    cd "$PROJECT_DIR" || error_exit "Project directory not found"
    
    # Pull latest changes
    log "Pulling latest changes..."
    git fetch origin
    git reset --hard origin/main
    
    # Update backend
    log "Updating backend..."
    cd backend
    npm ci --only=production
    npm run build
    
    # Update frontend
    log "Updating frontend..."
    cd ../frontend
    npm ci --only=production
    npm run build
    
    # Restart services
    log "Restarting services..."
    pm2 restart backend
    pm2 restart frontend
    
    # Health check
    log "Performing health checks..."
    sleep 10
    
    # Test backend
    if curl -f http://localhost:3001/ > /dev/null 2>&1; then
        log "${GREEN}✅ Backend health check passed${NC}"
    else
        error_exit "Backend health check failed"
    fi
    
    # Test frontend
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        log "${GREEN}✅ Frontend health check passed${NC}"
    else
        error_exit "Frontend health check failed"
    fi
    
    log "${GREEN}🎉 Deployment completed successfully!${NC}"
}

# Main execution
if [ "$ROLLBACK" = true ]; then
    rollback
else
    deploy
fi 