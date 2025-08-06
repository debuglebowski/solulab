#!/usr/bin/env bash

# Solulab Development Script
# Runs multiple watchers concurrently for development

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Solulab Development Environment...${NC}"
echo ""

# Check if concurrently is installed
if ! command -v concurrently &> /dev/null; then
    echo -e "${RED}Error: 'concurrently' is not installed${NC}"
    echo "Please run 'bun install' in the root directory first"
    exit 1
fi

# Navigate to root directory (parent of scripts folder)
cd "$(dirname "$0")/.." || exit

echo -e "${GREEN}Starting watchers:${NC}"
echo "  • TypeScript watch (solulab)"
echo "  • TypeScript watch (solulab-demo)"
echo "  • Build watch (solulab)"
echo ""

# Run concurrent processes with proper labels and colors
concurrently \
    --prefix "[{name}]" \
    --names "TS:lib,TS:demo,BUILD" \
    --prefix-colors "blue,green,yellow" \
    --kill-others \
    --restart-tries 0 \
    "(cd solulab && bun run tswatch)" \
    "(cd solulab-demo && bun run tswatch)" \
    "(cd solulab && bun run build:watch)"

# This will only run if concurrently exits
echo ""
echo -e "${YELLOW}Development environment stopped${NC}"
