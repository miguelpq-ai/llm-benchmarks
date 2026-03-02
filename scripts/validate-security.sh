#!/bin/bash
# Security validation script
# Run before committing: ./scripts/validate-security.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Running security validation..."
echo ""

ERRORS=0
WARNINGS=0

# Check 1: .env files
echo "1️⃣  Checking for .env files..."
if git ls-files | grep -E '\.env(\..*)?$' | grep -v '\.env\.example'; then
    echo -e "${RED}❌ ERROR: .env files detected!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No .env files${NC}"
fi
echo ""

# Check 2: Hardcoded secrets in staged files
echo "2️⃣  Checking for hardcoded secrets in staged changes..."
PATTERNS="api_key|password|secret|sk_live_|pk_live_|sk_test_|pk_test_|stripe_secret|supabase_key"
if git diff --cached | grep -iE "$PATTERNS" | grep -v "\.env\.example" | grep -v "NEXT_PUBLIC_"; then
    echo -e "${RED}❌ ERROR: Possible secrets in staged changes!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No obvious secrets${NC}"
fi
echo ""

# Check 3: Secrets in uncommitted changes
echo "3️⃣  Checking for secrets in uncommitted changes..."
if git diff | grep -iE "$PATTERNS" | grep -v "\.env\.example" | grep -v "NEXT_PUBLIC_"; then
    echo -e "${RED}❌ ERROR: Secrets in working directory!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ No secrets in working changes${NC}"
fi
echo ""

# Check 4: Private business data
echo "4️⃣  Checking for private business data..."
if git diff --cached | grep -iE "revenue|profit margin|cost analysis|internal budget"; then
    echo -e "${YELLOW}⚠️  WARNING: Possible private business data${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ No obvious private data${NC}"
fi
echo ""

# Check 5: .gitignore coverage
echo "5️⃣  Checking .gitignore coverage..."
REQUIRED_PATTERNS=("\.env" "node_modules" "\.next")
MISSING=0
for pattern in "${REQUIRED_PATTERNS[@]}"; do
    if ! grep -q "$pattern" .gitignore; then
        echo -e "${RED}❌ Missing pattern in .gitignore: $pattern${NC}"
        MISSING=$((MISSING + 1))
        ERRORS=$((ERRORS + 1))
    fi
done
if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✅ .gitignore has required patterns${NC}"
fi
echo ""

# Check 6: .env.example validity
echo "6️⃣  Checking .env.example..."
if [ -f .env.example ]; then
    if grep -E "sk_live_|pk_live_" .env.example; then
        echo -e "${RED}❌ ERROR: Real credentials in .env.example!${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✅ .env.example has placeholders only${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env.example not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 7: Console logs in production code
echo "7️⃣  Checking for console.log in production code..."
if find src api -name "*.js" -type f 2>/dev/null | xargs grep -l "console\.\(log\|error\|warn\)" 2>/dev/null | grep -v test; then
    echo -e "${YELLOW}⚠️  WARNING: console statements in production code${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ No console statements${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VALIDATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    echo ""
    echo "Fix the errors above before committing:"
    echo "  git reset HEAD .    # Unstage all"
    echo "  git checkout .      # Discard changes"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  VALIDATION PASSED (with warnings)${NC}"
    echo ""
    echo "Review warnings before pushing"
    exit 0
else
    echo -e "${GREEN}✅ VALIDATION PASSED${NC}"
    echo ""
    echo "Safe to commit and push!"
    exit 0
fi
