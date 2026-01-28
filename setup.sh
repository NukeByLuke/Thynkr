#!/bin/bash
# Thynkr Setup Script for Linux/macOS
# This script automates the initial setup for contributors

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Flags
SKIP_DOCKER=false
SKIP_DEPS=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --skip-docker) SKIP_DOCKER=true ;;
        --skip-deps) SKIP_DEPS=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════════════════╗
║                                                    ║
║              🧠 THYNKR SETUP                      ║
║                                                    ║
║   AI-Powered Learning Platform - Setup Wizard     ║
║                                                    ║
╚════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Helper functions
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_status() {
    local message=$1
    local status=${2:-"info"}
    
    case $status in
        "success") echo -e "${GREEN}✓ $message${NC}" ;;
        "error") echo -e "${RED}✗ $message${NC}" ;;
        "warning") echo -e "${YELLOW}⚠ $message${NC}" ;;
        *) echo -e "${CYAN}→ $message${NC}" ;;
    esac
}

# 1. Check Prerequisites
echo -e "\n${YELLOW}[1/8] Checking Prerequisites...${NC}"

missing_tools=()

if ! command_exists node; then
    missing_tools+=("Node.js (v18+)")
fi
if ! command_exists pnpm; then
    missing_tools+=("pnpm (v8+)")
fi
if ! $SKIP_DOCKER && ! command_exists docker; then
    missing_tools+=("Docker")
fi
if ! command_exists git; then
    missing_tools+=("Git")
fi

if [ ${#missing_tools[@]} -ne 0 ]; then
    print_status "Missing required tools:" "error"
    printf '%s\n' "${missing_tools[@]}" | sed 's/^/  - /'
    echo -e "\n${YELLOW}Please install the missing tools and try again.${NC}"
    echo -e "  ${GRAY}• Node.js: https://nodejs.org/${NC}"
    echo -e "  ${GRAY}• pnpm: npm install -g pnpm${NC}"
    echo -e "  ${GRAY}• Docker: https://www.docker.com/products/docker-desktop/${NC}"
    exit 1
fi

print_status "All prerequisites found" "success"

# 2. Setup Environment Files
echo -e "\n${YELLOW}[2/8] Setting up environment files...${NC}"

if [ ! -f ".env" ]; then
    cp ".env.example" ".env"
    print_status "Created root .env file" "success"
else
    print_status "Root .env already exists" "warning"
fi

if [ ! -f "frontend/.env" ]; then
    cp "frontend/.env.example" "frontend/.env"
    print_status "Created frontend .env file" "success"
else
    print_status "Frontend .env already exists" "warning"
fi

# 3. Install Dependencies
if ! $SKIP_DEPS; then
    echo -e "\n${YELLOW}[3/8] Installing dependencies...${NC}"
    
    if pnpm install --frozen-lockfile; then
        print_status "Dependencies installed successfully" "success"
    else
        print_status "Failed to install dependencies" "error"
        exit 1
    fi
else
    echo -e "\n${GRAY}[3/8] Skipping dependency installation${NC}"
fi

# 4. Start Docker Services
if ! $SKIP_DOCKER; then
    echo -e "\n${YELLOW}[4/8] Starting Docker services (PostgreSQL & Redis)...${NC}"
    
    if docker-compose up -d postgres redis; then
        print_status "Docker services started" "success"
        
        # Wait for PostgreSQL to be ready
        echo -e "   ${GRAY}Waiting for PostgreSQL to be ready...${NC}"
        sleep 5
        
        # Check if PostgreSQL is healthy
        max_retries=30
        retry_count=0
        is_healthy=false
        
        while [ $retry_count -lt $max_retries ] && [ "$is_healthy" = false ]; do
            if docker-compose exec -T postgres pg_isready -U thynkr >/dev/null 2>&1; then
                is_healthy=true
                print_status "PostgreSQL is ready" "success"
            else
                sleep 1
                ((retry_count++))
            fi
        done
        
        if [ "$is_healthy" = false ]; then
            print_status "PostgreSQL failed to start in time" "warning"
            echo -e "   ${GRAY}You may need to manually check Docker logs${NC}"
        fi
    else
        print_status "Failed to start Docker services" "error"
        exit 1
    fi
else
    echo -e "\n${GRAY}[4/8] Skipping Docker services (manual mode)${NC}"
fi

# 5. Create Database (if it doesn't exist)
echo -e "\n${YELLOW}[5/8] Initializing database...${NC}"

if ! $SKIP_DOCKER; then
    if docker-compose exec -T postgres psql -U thynkr -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw thynkr_db; then
        print_status "Database already exists" "success"
    else
        echo -e "   ${GRAY}Creating database 'thynkr_db'...${NC}"
        if docker-compose exec -T postgres psql -U thynkr -c "CREATE DATABASE thynkr_db;" >/dev/null 2>&1; then
            print_status "Database created" "success"
        else
            print_status "Note: Database creation skipped (may already exist)" "warning"
        fi
    fi
else
    echo -e "   ${YELLOW}Ensure your PostgreSQL database 'thynkr_db' exists${NC}"
fi

# 6. Run Prisma Migrations
echo -e "\n${YELLOW}[6/8] Running database migrations...${NC}"

cd backend
if pnpm prisma migrate dev --name init 2>/dev/null; then
    print_status "Database migrations completed" "success"
else
    print_status "Migration failed (may be normal if already migrated)" "warning"
fi
cd ..

# 7. Generate Prisma Client
echo -e "\n${YELLOW}[7/8] Generating Prisma Client...${NC}"

if pnpm --filter backend db:generate; then
    print_status "Prisma Client generated" "success"
else
    print_status "Failed to generate Prisma Client" "error"
    exit 1
fi

# 8. Summary
echo -e "\n${GREEN}[8/8] Setup Complete! 🎉${NC}"

cat << EOF

${GREEN}╔════════════════════════════════════════════════════╗
║                  NEXT STEPS                        ║
╚════════════════════════════════════════════════════╝${NC}

${NC}1. Configure your .env file with API keys:
   ${GRAY}• OPENAI_API_KEY (required for AI features)
   • STRIPE_SECRET_KEY (for payment testing)${NC}

2. Start the development servers:
   ${CYAN}pnpm dev${NC}

3. Access the application:
   ${CYAN}• Frontend:  http://localhost:5173
   • Backend:   http://localhost:3001${NC}

4. Create an admin user (optional):
   ${CYAN}cd backend && node create-admin.js${NC}

For more information, see:
   ${GRAY}• docs/CONTRIBUTING.md
   • README.md${NC}

Need help? Open an issue at:
   ${CYAN}https://github.com/NukeByLuke/Thynkr/issues${NC}

EOF
