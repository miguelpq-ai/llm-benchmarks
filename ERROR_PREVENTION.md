# Error Prevention System - Complete Guide

**How we prevent mistakes, security issues, and bad deployments**

---

## TL;DR (The Quick Version)

**You never have to worry about:**
- Accidentally committing secrets ✅ (Husky blocks)
- Pushing credentials ✅ (GitHub scans)
- Deploying broken code ✅ (Tests + linting)
- Leaking private data ✅ (Workflow validates)

**How?** Three layers of automation + my daily review.

---

## System Overview

```
YOU WRITE CODE
      ↓
Husky pre-commit hooks
  ├─ Blocks .env files? NO → Continue
  ├─ Secrets detected? NO → Continue
  ├─ Private data? NO → Continue
  └─ All pass? → Allow commit
      ↓
YOU RUN: git push
      ↓
GitHub Actions Workflows (Automated)
  ├─ TruffleHog scans for secrets
  ├─ npm audit checks dependencies
  ├─ Linter checks code quality
  ├─ Documentation validator
  └─ All pass? → PR/commit allowed
      ↓
I REVIEW DAILY
  ├─ Read commit history
  ├─ Check workflow results
  ├─ Spot-check code
  ├─ Monitor for patterns
  └─ Alert you if suspicious → WhatsApp
      ↓
CODE IS SAFE TO DEPLOY
```

---

## Layer 1: Local Protection (On Your Machine)

### Husky Pre-Commit Hooks

**What it is:** Git hook that runs before commit completes

**What it checks:**
```bash
✓ No .env files
✓ No hardcoded API keys
✓ No credentials
✓ .gitignore intact
```

**If it blocks:**
```bash
git reset HEAD .
git checkout .
# Fix the issue
git commit -m "..."
```

**How to enable:**
```bash
npm install        # Husky auto-installs via "prepare" script
```

---

### Validation Script

**Run before pushing:**
```bash
./scripts/validate-security.sh
```

**What it checks:**
1. No `.env` files in repo
2. No hardcoded secrets in staged code
3. No secrets in working directory
4. No private business data
5. `.gitignore` has required patterns
6. `.env.example` has placeholders only
7. No console logs in production code

**Output:** ✅ PASS or ❌ FAIL

---

## Layer 2: GitHub Automation

### Security Workflow
**File:** `.github/workflows/security.yml`

**Runs on:** Every push + PR

**Checks:**

#### 1. TruffleHog Secret Scanner
- Industry-standard tool
- Searches entire repo history
- Detects API keys, passwords, tokens
- Blocks if found

#### 2. .env File Verification
- Confirms no `.env*` files in repo
- Excludes `.env.example` (safe)
- Blocks merge if found

#### 3. Hardcoded Secrets
- Scans code for patterns:
  - `sk_live_`, `pk_live_`
  - `api_key=`, `password=`
  - `secret=`, `token=`
- Blocks if detected

#### 4. Dependency Audit
```bash
npm audit --audit-level=moderate
```
- Checks for known vulnerabilities
- Warns if dependencies outdated
- Non-blocking (info only)

#### 5. Code Quality
- Linting checks
- Console.log detection
- Non-blocking (warnings)

#### 6. Documentation Validation
- Scans `.md` files for credentials
- Verifies `.env.example` safety
- Blocks if real keys found

**You see results:**
- PR shows ✅ (all pass) or ❌ (failed)
- Click "Checks" to see details
- Can't merge if critical checks fail

---

## Layer 3: Human Review (Me - Miguel)

### Daily Monitoring

**What I do every morning:**
```bash
git log --oneline -10          # See latest commits
git diff HEAD~10               # Review changes
gh api repos/.../commits       # Check workflow results
# Look for suspicious patterns
```

**What I check:**
1. Commit messages (sense check)
2. Files changed (expected?)
3. Code patterns (risky?)
4. Workflow results (all green?)
5. Security alerts (any detected?)

**If I find something:**
- WhatsApp alert (immediate)
- GitHub issue (for discussion)
- PR comment (on specific code)

---

### Pattern Detection

**Patterns I watch for:**
- Multiple commits in quick succession
- Unusual file changes
- Large files being committed
- Changes to security-critical files
- Skipped tests

**My tooling:**
```bash
# I run these checks manually
git log --since="24 hours ago"  # Recent commits
git diff --stat                 # What changed
git log -p --oneline            # Code changes
grep -r "secrets" .             # Ad-hoc scanning
```

---

## Error Prevention Checklist

### Before You Commit

- [ ] Run `./scripts/validate-security.sh`
- [ ] Review `git diff --cached`
- [ ] Confirm no `.env` files
- [ ] Confirm no credentials visible
- [ ] Read Husky output (if blocked)

### Before You Push

- [ ] Wait for Husky to complete (should be instant)
- [ ] Run `git push origin branch`
- [ ] Check GitHub - wait for Actions
- [ ] Verify all checks pass ✅
- [ ] If any fail, fix before continuing

### Before Deployment

- [ ] All GitHub checks pass
- [ ] I've reviewed changes
- [ ] Security scan is green
- [ ] Documentation updated
- [ ] No suspicious patterns

---

## Common Issues & Solutions

### Issue: Husky blocks my commit
```bash
error: .env file staged!
```

**Solution:**
```bash
git reset HEAD .env*
git checkout .env*
git add -A
git commit -m "..."
```

---

### Issue: GitHub Actions failing
Shows ❌ on PR

**Solution:**
1. Click "Checks" → see which failed
2. Fix locally
3. `git push` again
4. Wait for Actions to re-run

---

### Issue: Validation script warns
```
⚠️  WARNING: possible private data
```

**Solution:**
1. Review `git diff --cached`
2. Remove sensitive lines
3. `git reset HEAD file.js`
4. `git checkout file.js`
5. Fix and try again

---

### Issue: You accidentally committed secret
```bash
git log -S "api_key=sk_live"  # Find it
```

**Solution:**
1. **STOP pushing immediately**
2. WhatsApp me
3. Rotate credential
4. I'll clean git history
5. Create new credential
6. Deploy fresh version

---

## Special Cases

### Claude Code Sessions
**Extra precaution:**
- Remind Claude Code to read SECURITY.md
- Review Claude's changes carefully
- Run validation before committing

---

### Sensitive Deployments
**Before going live:**
- Full manual security audit
- Dependency check
- Code review
- Credentials verified (not in repo)

---

## What Gets Logged

### I Keep Records Of:
✅ All commits (GitHub has history)
✅ All Actions results (GitHub archive)
✅ Security alerts (GitHub notifications)
✅ Issues reported (GitHub issues)
✅ Incidents (private log)

### I DON'T Keep:
❌ Your credentials
❌ Private business data
❌ Sensitive discussions
❌ Passwords or tokens

**Privacy:** Even I don't store sensitive stuff. GitHub does, but only encrypted.

---

## Metrics & Reports

### Weekly Report (I send you)
- Commits made
- Files changed
- Any blocked attempts
- Security score

### Monthly Audit
- Full repo scan
- Dependency updates
- Security improvements
- Incident review (if any)

### Quarterly Review
- Update security guidelines
- Review incident patterns
- Tighten policies if needed
- Train on lessons learned

---

## Your Responsibilities

**You must:**
- Read SECURITY.md before coding
- Run validation script before pushing
- Honor Husky warnings
- Don't bypass pre-commit hooks
- Alert me to issues immediately

**I handle:**
- Daily monitoring
- GitHub Actions setup
- Security incident response
- Credential rotation
- Deployment verification

---

## Emergency Procedures

### If Credentials Leak

**IMMEDIATE (< 5 min):**
1. WhatsApp me
2. Stop using that credential
3. Rotate credential immediately

**NEXT (< 1 hour):**
1. I remove from git history
2. New credential deployed
3. Verify no access from stolen credential

**FOLLOW-UP (< 24 hours):**
1. Document incident
2. Review how it happened
3. Improve prevention
4. Audit all other secrets

---

## FAQ

**Q: Will Husky slow down my workflow?**
A: No. Pre-commit checks take <1 second.

**Q: Can I bypass Husky?**
A: You can (`git commit --no-verify`), but don't. The checks are there for you.

**Q: What if validation script fails?**
A: Fix the issue (it'll tell you how). Usually just "reset HEAD" and try again.

**Q: Can I commit without running the script?**
A: Husky will run checks anyway. Script is just a pre-check.

**Q: How fast is the GitHub security scan?**
A: 2-5 minutes per commit. You'll see results in PR.

**Q: What if I missed something?**
A: I check daily. I'll catch it and alert you.

---

## Success Criteria

**This system is working if:**
- ✅ Zero secrets ever leak
- ✅ Zero private data exposed
- ✅ Zero broken deployments
- ✅ You never manually catch issues
- ✅ I catch 100% of problems first

**This system is failing if:**
- ❌ Secret leaked to public
- ❌ Private data in commits
- ❌ Broken code deployed
- ❌ You had to catch issue manually
- ❌ Issue discovered in production

---

**Bottom line:** You code freely. The system protects you. I watch your back.

Ask questions anytime! 🔒
