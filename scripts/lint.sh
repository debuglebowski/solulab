#!/usr/bin/env bash

# Solulab Linting Script
# Runs various linters and formatters with flexible options

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default settings
RUN_BIOME=true
RUN_ESLINT=true
RUN_FORMAT=false
FORMAT_ONLY=false
FIX_MODE=false
CHECK_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --fix)
            FIX_MODE=true
            shift
            ;;
        --biome-only)
            RUN_ESLINT=false
            shift
            ;;
        --eslint-only)
            RUN_BIOME=false
            shift
            ;;
        --format)
            RUN_FORMAT=true
            shift
            ;;
        --format-only)
            FORMAT_ONLY=true
            RUN_FORMAT=true
            shift
            ;;
        --check)
            CHECK_MODE=true
            RUN_FORMAT=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --fix           Apply auto-fixes where possible"
            echo "  --biome-only    Run only Biome linter"
            echo "  --eslint-only   Run only ESLint"
            echo "  --format        Include format checks"
            echo "  --format-only   Run only format checks"
            echo "  --check         Run all checks (format + lint) without fixes"
            echo "  -h, --help      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                  # Run all linters (biome + eslint)"
            echo "  $0 --fix            # Run all linters and apply fixes"
            echo "  $0 --biome-only     # Run only Biome linter"
            echo "  $0 --format-only    # Check formatting only"
            echo "  $0 --check          # Run all checks without fixes"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Navigate to root directory (parent of scripts folder)
cd "$(dirname "$0")/.." || exit

# Track exit code
EXIT_CODE=0

# Helper function to run command and track exit code
run_command() {
    local label=$1
    local cmd=$2
    
    echo -e "${CYAN}Running: ${label}${NC}"
    if eval "$cmd"; then
        echo -e "${GREEN}✓ ${label} passed${NC}"
    else
        echo -e "${RED}✗ ${label} failed${NC}"
        EXIT_CODE=1
    fi
    echo ""
}

echo -e "${BLUE}Starting Solulab Linting...${NC}"
echo ""

# Run format checks if requested
if [[ "$RUN_FORMAT" == true ]]; then
    if [[ "$FIX_MODE" == true ]] && [[ "$CHECK_MODE" == false ]]; then
        run_command "Biome Format (fix)" "npx biome format --write ."
    else
        run_command "Biome Format (check)" "npx biome format ."
    fi
fi

# Exit early if format-only mode
if [[ "$FORMAT_ONLY" == true ]]; then
    if [[ $EXIT_CODE -eq 0 ]]; then
        echo -e "${GREEN}All format checks passed!${NC}"
    else
        echo -e "${YELLOW}Format checks completed with issues${NC}"
    fi
    exit $EXIT_CODE
fi

# Run Biome linter
if [[ "$RUN_BIOME" == true ]]; then
    if [[ "$FIX_MODE" == true ]] && [[ "$CHECK_MODE" == false ]]; then
        run_command "Biome Lint (fix)" "npx biome lint --write ."
    else
        run_command "Biome Lint" "npx biome lint ."
    fi
fi

# Run ESLint
if [[ "$RUN_ESLINT" == true ]]; then
    if [[ "$FIX_MODE" == true ]] && [[ "$CHECK_MODE" == false ]]; then
        run_command "ESLint (fix)" "npx eslint --fix ."
    else
        run_command "ESLint" "npx eslint ."
    fi
fi

# Final status
echo ""
if [[ $EXIT_CODE -eq 0 ]]; then
    echo -e "${GREEN}✓ All linting checks passed!${NC}"
else
    echo -e "${YELLOW}⚠ Linting completed with issues${NC}"
    if [[ "$FIX_MODE" == false ]] && [[ "$CHECK_MODE" == false ]]; then
        echo -e "${CYAN}Tip: Run with --fix to auto-fix issues${NC}"
    fi
fi

exit $EXIT_CODE