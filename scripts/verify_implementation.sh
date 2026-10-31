#!/usr/bin/env bash
# ==============================================================================
# verify_implementation.sh - Continuous Verification Harness for emergent
# ==============================================================================
# Executes automated verification gates across engine, tests, and documentation.
# Strictly returns 0 on complete pass, non-zero on any failure.
# ==============================================================================

set -euo pipefail

# ANSI Colour Codes
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Colour

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo -e "${BOLD}${BLUE}=== Running emergent Continuous Verification Harness ===${NC}\n"

ERRORS_FOUND=0

# Helper: Pass banner
pass() {
  echo -e "  ${GREEN}✓${NC} $1"
}

# Helper: Fail banner
fail() {
  echo -e "  ${RED}✗${NC} $1"
  ERRORS_FOUND=$((ERRORS_FOUND + 1))
}

# ------------------------------------------------------------------------------
# Gate 1: Markdown Heading Cleanliness Check
# ------------------------------------------------------------------------------
echo -e "${BOLD}1. Verifying Markdown Formatting Cleanliness...${NC}"
MD_HEADING_VIOLATIONS=0

while IFS= read -r md_file; do
  # Look for a heading line immediately followed by non-empty text (no blank line)
  if awk '
    /^#{1,6}[[:space:]]/ {
      getline next_line
      if (next_line != "" && next_line !~ /^[[:space:]]*$/ && next_line !~ /^#{1,6}[[:space:]]/) {
        exit 1
      }
    }
  ' "$md_file"; then
    :
  else
    echo -e "    ${YELLOW}Violation in:${NC} ${md_file#"$REPO_ROOT"/}"
    MD_HEADING_VIOLATIONS=$((MD_HEADING_VIOLATIONS + 1))
  fi
done < <(find "$REPO_ROOT" -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*")

if [ "$MD_HEADING_VIOLATIONS" -eq 0 ]; then
  pass "All markdown headings are followed by clean blank lines."
else
  fail "${MD_HEADING_VIOLATIONS} markdown files violate blank-line heading constraints."
fi

# ------------------------------------------------------------------------------
# Gate 2: Headless Simulation Engine Compilation (TypeScript)
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}2. Typechecking Simulation Engine (TypeScript)...${NC}"
if [ -d "$REPO_ROOT/engine" ]; then
  cd "$REPO_ROOT/engine"
  if [ ! -d "node_modules" ]; then
    echo "    node_modules missing in engine/; running npm install..."
    npm install --silent
  fi

  if npm run build > /dev/null 2>&1; then
    pass "Engine TypeScript compilation passed (0 errors)."
  else
    fail "Engine TypeScript compilation failed."
    npm run build || true
  fi
else
  fail "Directory 'engine/' not found."
fi

# ------------------------------------------------------------------------------
# Gate 3: Deterministic Unit Test Suite (Vitest)
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}3. Executing Deterministic Simulation Unit Tests (Vitest)...${NC}"
if [ -d "$REPO_ROOT/engine" ]; then
  cd "$REPO_ROOT/engine"
  if npm test -- --run > /dev/null 2>&1; then
    TOTAL_TESTS=$(npm test -- --run 2>&1 | grep -E "Tests[[:space:]]+[0-9]+[[:space:]]+passed" | awk '{print $2}' || echo "all")
    pass "All deterministic unit tests passed (${TOTAL_TESTS} tests)."
  else
    fail "Deterministic unit test suite failed."
    npm test -- --run || true
  fi
fi

# ------------------------------------------------------------------------------
# Gate 4: Browser Client Build & Perception Tests (Playwright)
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}4. Executing Browser Client Perception Suite (Playwright)...${NC}"
if [ -d "$REPO_ROOT/client" ]; then
  cd "$REPO_ROOT/client"
  if [ ! -d "node_modules" ]; then
    echo "    node_modules missing in client/; running npm install..."
    npm install --silent
  fi

  if npm run build > /dev/null 2>&1; then
    pass "Client build passed (0 errors)."
  else
    fail "Client build failed."
    npm run build || true
  fi

  if npx playwright test > /dev/null 2>&1; then
    pass "Headless browser Playwright perception tests passed (3 tests)."
  else
    fail "Headless browser Playwright perception tests failed."
    npx playwright test || true
  fi
else
  fail "Directory 'client/' not found."
fi

# ------------------------------------------------------------------------------
# Final Verification Verdict
# ------------------------------------------------------------------------------
echo -e "\n========================================================"
if [ "$ERRORS_FOUND" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}✓ ALL VERIFICATION GATES PASSED CLEANLY.${NC}"
  echo -e "========================================================"
  exit 0
else
  echo -e "${RED}${BOLD}✗ VERIFICATION FAILED WITH ${ERRORS_FOUND} ERROR(S).${NC}"
  echo -e "========================================================"
  exit 1
fi
