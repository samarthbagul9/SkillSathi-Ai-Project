#!/bin/bash

# Switch to the script's directory so it runs correctly from anywhere
cd "$(dirname "$0")"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== SkillSathi AI Platform Bootstrapper ===${NC}"

# Function to check and free a port
check_and_free_port() {
    local port=$1
    local name=$2
    local pid=$(lsof -t -i:$port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Port $port ($name) is already in use by process PID $pid.${NC}"
        echo -e "Attempting to terminate the process..."
        kill -9 $pid
        sleep 1
        # Double check
        pid_check=$(lsof -t -i:$port)
        if [ ! -z "$pid_check" ]; then
            echo -e "${RED}Failed to free port $port. Please kill PID $pid_check manually.${NC}"
            exit 1
        else
            echo -e "${GREEN}Successfully freed port $port.${NC}"
        fi
    fi
}

# 1. Clean up existing ports if they are in use
check_and_free_port 5008 "C# Backend"
check_and_free_port 5173 "React Frontend"

# 2. Setup .NET environment variables
export PATH="/Users/sahil/.dotnet:$PATH"
export DOTNET_ROOT="/Users/sahil/.dotnet"

# Verify dotnet
if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}Error: dotnet command could not be found. Please ensure .NET 8 SDK is installed at /Users/sahil/.dotnet${NC}"
    exit 1
fi

echo -e "${GREEN}Using .NET Version: $(dotnet --version)${NC}"

# Verify Node & NPM
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: node command could not be found.${NC}"
    exit 1
fi
echo -e "${GREEN}Using Node Version: $(node -v)${NC}"

# 3. Start Backend
echo -e "\n${GREEN}Starting .NET 8 Backend (on port 5008)...${NC}"
cd backend
dotnet run > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "Backend started with PID $BACKEND_PID. Logs are being written to backend.log."

cd ..

# 4. Start Frontend
echo -e "\n${GREEN}Starting React Frontend (Vite)...${NC}"
cd frontend
# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules not found. Installing frontend dependencies...${NC}"
    npm install
fi
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "Frontend started with PID $FRONTEND_PID. Logs are being written to frontend.log."

cd ..

echo -e "\n${GREEN}===================================================${NC}"
echo -e "${GREEN}Both servers are starting up!${NC}"
echo -e "- Frontend will be available at: ${YELLOW}http://localhost:5173${NC}"
echo -e "- Backend API is hosted at:       ${YELLOW}http://localhost:5008${NC}"
echo -e "- Swagger UI is available at:     ${YELLOW}http://localhost:5008/swagger${NC}"
echo -e "- To stop both servers, run:     ${RED}kill $BACKEND_PID $FRONTEND_PID${NC}"
echo -e "===================================================${NC}\n"

# Monitor logs
echo -e "Tailing backend.log (Press Ctrl+C to exit log tailing, servers will keep running in the background):"
tail -f backend.log
