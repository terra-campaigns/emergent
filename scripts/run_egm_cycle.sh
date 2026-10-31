#!/usr/bin/env bash
# ==============================================================================
# run_egm_cycle.sh - Elephant-Goldfish Model (Google EGM) Automation Harness
# ==============================================================================
# Audits, validates, and reports on the EGM specification and review gates.
# ==============================================================================

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DESIGNS_DIR="${REPO_ROOT}/docs/designs"
REVIEWS_DIR="${REPO_ROOT}/docs/reviews"

command_status() {
  echo -e "${BOLD}${BLUE}=== Google EGM Governance Status ===${NC}\n"
  
  echo -e "${BOLD}Living Design Specifications (docs/designs/):${NC}"
  for spec in "${DESIGNS_DIR}"/*.md; do
    [ -e "$spec" ] || continue
    basename=$(basename "$spec")
    [ "$basename" = "TEMPLATE.md" ] && continue

    status_line=$(grep -E "^(\*\*)?Status:(\*\*)?" "$spec" | head -n 1 || echo "Status: Unknown")
    echo -e "  • ${BOLD}${basename}${NC} — ${status_line}"
  done

  echo -e "\n${BOLD}Goldfish Review Reports (docs/reviews/):${NC}"
  for review in "${REVIEWS_DIR}"/*.md; do
    [ -e "$review" ] || continue
    basename=$(basename "$review")
    [ "$basename" = "TEMPLATE.md" ] && continue

    verdict_line=$(grep -E "^(\*\*)?Verdict:(\*\*)?" "$review" | head -n 1 || echo "Verdict: Unknown")
    echo -e "  • ${BOLD}${basename}${NC} — ${verdict_line}"
  done
  echo ""
}

command_validate() {
  echo -e "${BOLD}${BLUE}=== Validating EGM Contract Consistency ===${NC}\n"
  ERRORS=0

  for spec in "${DESIGNS_DIR}"/*.md; do
    [ -e "$spec" ] || continue
    basename=$(basename "$spec")
    [ "$basename" = "TEMPLATE.md" ] && continue

    # Check that a corresponding review file exists
    spec_num=$(echo "$basename" | grep -o -E '^[0-9]+' || true)
    if [ -n "$spec_num" ]; then
      matching_review=$(find "${REVIEWS_DIR}" -name "${spec_num}_*.md" | head -n 1)
      if [ -z "$matching_review" ]; then
        echo -e "  ${RED}✗${NC} Specification ${basename} lacks a Goldfish review in docs/reviews/."
        ERRORS=$((ERRORS + 1))
      else
        echo -e "  ${GREEN}✓${NC} Specification ${basename} has matching review: $(basename "$matching_review")"
      fi
    fi

    # Check for required sections in the specification
    for section in "1. Overview & Objectives" "3. State Schema & Data Models" "4. Invariants & Rules" "5. Simulation & Tick Mechanics" "7. Verification & Automated Test Strategy"; do
      if ! grep -q "$section" "$spec"; then
        echo -e "  ${RED}✗${NC} Specification ${basename} is missing section '${section}'."
        ERRORS=$((ERRORS + 1))
      fi
    done
  done

  echo ""
  if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ EGM Specification contracts are consistent and complete.${NC}"
    return 0
  else
    echo -e "${RED}${BOLD}✗ EGM Validation failed with ${ERRORS} error(s).${NC}"
    return 1
  fi
}

command_help() {
  echo -e "${BOLD}Usage:${NC} ./scripts/run_egm_cycle.sh [command]"
  echo ""
  echo "Commands:"
  echo "  status     Display the state of all design specs and review reports."
  echo "  validate   Verify that all specifications comply with EGM section schemas and have reviews."
  echo "  help       Show this guidance message."
}

ACTION="${1:-status}"
case "$ACTION" in
  status)
    command_status
    ;;
  validate)
    command_validate
    ;;
  help|--help|-h)
    command_help
    ;;
  *)
    echo -e "${RED}Unknown action: ${ACTION}${NC}\n"
    command_help
    exit 1
    ;;
esac
