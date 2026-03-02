# Security Checklist - Before Every Commit

**This repo is PUBLIC. Use this checklist every time before pushing.**

---

## ✅ Pre-Commit Checks

Run this before `git push`:

```bash
# 1. Check staged files for secrets
git diff --cached | grep -iE "api_key|password|secret|token|pk_|sk_|stripe|supabase" && echo "❌ FOUND SECRETS!" || echo "✅ No obvious secrets"

# 2. Check for .env files
git status | grep "\.env" && echo "❌ .env file staged!" || echo "✅ No .env files"

# 3. Review what you're committing
git diff --cached --name-only
git diff --cached  # Review the actual changes

# 4. Final safety check
git status
```

---

## 🚫 Never Commit

- [ ] `.env` files (any variant)
- [ ] `credentials.json` or similar
- [ ] Private keys (`.pem`, `.key`, `.crt`)
- [ ] API keys, tokens, or secrets
- [ ] Database passwords
- [ ] Stripe/Supabase real credentials
- [ ] Private business metrics (revenue, cost, profit)
- [ ] Personal information
- [ ] Internal strategy documents
- [ ] Hard-coded credentials anywhere

---

## ✅ Safe to Commit

- [ ] `.env.example` (with placeholder values)
- [ ] Code (without secrets embedded)
- [ ] Documentation (public information)
- [ ] Architecture diagrams
- [ ] Public API specs
- [ ] Configuration templates
- [ ] Tests (no real credentials)

---

## 📋 Documentation Check

Before committing `.md` files:

- [ ] No real API keys shown
- [ ] No private business data
- [ ] All examples use `YOUR_VALUE` or similar placeholders
- [ ] No credentials in code examples
- [ ] No sensitive URLs or IPs

Example ✅ SAFE:
```markdown
Set your API key: `STRIPE_KEY=sk_test_your_key_here`
```

Example ❌ UNSAFE:
```markdown
Use this key: `sk_live_abc123xyz...`
```

---

## 🔍 Code Review Checklist

When reviewing Claude Code changes:

- [ ] No hardcoded secrets in code
- [ ] Environment variables used (not hardcoded values)
- [ ] `.env.example` updated if new vars added
- [ ] `.gitignore` covers all sensitive files
- [ ] No `console.log()` of sensitive data
- [ ] No credentials in comments
- [ ] SQL queries parameterized (no injection risk)
- [ ] API keys use `process.env`

---

## 🚨 If You Commit a Secret

**Immediate actions:**
1. **Do NOT push** if you haven't pushed yet
2. **If already pushed:** Rotate credential immediately
3. **Remove from history:** Ask me for help (git filter-branch)
4. **Create new credential** with rotated key
5. **Document in INCIDENT_LOG.md**

---

## 📊 Incident Log

Keep track of any security events:

```markdown
## [DATE] Incident Report

**What:** Description of issue
**When discovered:** Date/time
**Action taken:** Immediate response
**Root cause:** Why it happened
**Prevention:** How to prevent next time
```

---

## 🎯 Weekly Audit

Every Monday (or monthly):
```bash
# Find any secrets accidentally committed
git log -S "password" --all --oneline
git log -S "api_key" --all --oneline
git log -S "sk_live" --all --oneline
git log -S "pk_live" --all --oneline

# Check recent commits
git log --oneline -10
git diff HEAD~10 | grep -i "secret\|password\|api_key"
```

---

## 📞 Emergency Contact

If security issue discovered:
- WhatsApp Cristian immediately
- DO NOT create GitHub issue
- DO NOT post about it publicly
- DO NOT push insecure code

---

**Golden Rule:** When in doubt, check with me before pushing 🔒
