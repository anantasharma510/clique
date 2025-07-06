#!/bin/bash

# Monitoring script for Synexis Clique
# Usage: ./monitor.sh [--continuous] [--interval=30]

set -e

# Configuration
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
LOG_FILE="/var/log/monitoring.log"
ALERT_EMAIL="admin@shoponclique.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
CONTINUOUS=false
INTERVAL=30

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --continuous)
            CONTINUOUS=true
            shift
            ;;
        --interval=*)
            INTERVAL="${1#*=}"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

# Check service health
check_service() {
    local service_name=$1
    local url=$2
    
    if curl -f -s "$url" > /dev/null 2>&1; then
        log "${GREEN}✅ $service_name is healthy${NC}"
        return 0
    else
        log "${RED}❌ $service_name is down${NC}"
        return 1
    fi
}

# Check system resources
check_resources() {
    # CPU usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    
    # Memory usage
    MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
    
    # Disk usage
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    
    log "System Resources - CPU: ${CPU_USAGE}%, Memory: ${MEMORY_USAGE}%, Disk: ${DISK_USAGE}%"
    
    # Alert if resources are high
    if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
        log "${YELLOW}⚠️  High CPU usage: ${CPU_USAGE}%${NC}"
    fi
    
    if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
        log "${YELLOW}⚠️  High memory usage: ${MEMORY_USAGE}%${NC}"
    fi
    
    if [ "$DISK_USAGE" -gt 80 ]; then
        log "${YELLOW}⚠️  High disk usage: ${DISK_USAGE}%${NC}"
    fi
}

# Check PM2 processes
check_pm2() {
    log "Checking PM2 processes..."
    
    if pm2 list | grep -q "online"; then
        log "${GREEN}✅ PM2 processes are running${NC}"
        pm2 list
    else
        log "${RED}❌ PM2 processes are down${NC}"
        return 1
    fi
}

# Check database connection
check_database() {
    log "Checking database connection..."
    
    if mongosh "mongodb://localhost:27017/synexis_clique" --eval "db.runCommand({ping: 1})" > /dev/null 2>&1; then
        log "${GREEN}✅ Database connection is healthy${NC}"
    else
        log "${RED}❌ Database connection failed${NC}"
        return 1
    fi
}

# Main monitoring function
monitor() {
    log "Starting health check..."
    
    local backend_healthy=true
    local frontend_healthy=true
    local pm2_healthy=true
    local db_healthy=true
    
    # Check services
    check_service "Backend" "$BACKEND_URL" || backend_healthy=false
    check_service "Frontend" "$FRONTEND_URL" || frontend_healthy=false
    check_pm2 || pm2_healthy=false
    check_database || db_healthy=false
    
    # Check system resources
    check_resources
    
    # Overall status
    if [ "$backend_healthy" = true ] && [ "$frontend_healthy" = true ] && [ "$pm2_healthy" = true ] && [ "$db_healthy" = true ]; then
        log "${GREEN}🎉 All systems are healthy!${NC}"
        return 0
    else
        log "${RED}🚨 Some systems are unhealthy${NC}"
        return 1
    fi
}

# Continuous monitoring
if [ "$CONTINUOUS" = true ]; then
    log "Starting continuous monitoring (interval: ${INTERVAL}s)"
    while true; do
        monitor
        sleep "$INTERVAL"
    done
else
    monitor
fi 