# Security Guidelines

**This is a PUBLIC repository. Follow these rules strictly.**

---

## 🔒 NEVER COMMIT

### Absolute No-No's
- ❌ `.env` files with real values
- ❌ API keys, tokens, secrets
- ❌ Private business data (metrics, revenue, strategy)
- ❌ Personal information (passwords, emails, phone numbers)
- ❌ Database credentials
- ❌ Stripe/Supabase keys

### Protected by .gitignore
These files are automatically excluded (double-check before committing):
```
.env
.env.local
.env.*.local
.env.production
.cache/
```

**VERIFY before EVERY commit:**
```bash
git status
# Should NOT show any .env files or secrets
```

---

## 🛡️ Safe Practices

### Environment Variables
✅ **DO THIS:**
```env
# .env.local (NEVER commit)
STRIPE_SECRET_KEY=sk_live_actual_key_here
SUPABASE_URL=https://actual.supabase.co
```

✅ **Document LIKE THIS:**
```env
# .env.local template (safe to commit as .env.example)
STRIPE_SECRET_KEY=your_stripe_key_here
SUPABASE_URL=your_supabase_url
```

### Code Comments
✅ **SAFE:**
```javascript
// Cost is per 1M tokens (public pricing from Anthropic)
const costs = {
  'Claude': 3.00  // Source: https://anthropic.com/pricing
};
```

❌ **UNSAFE:**
```javascript
// Our internal profit margin is 5x
const markup = 5.0;
```

### Documentation
✅ **SAFE:** Explain what users need to do
```markdown
1. Get your API key from Stripe
2. Set in `.env.local`: `STRIPE_KEY=your_key`
```

❌ **UNSAFE:** Show real credentials
```markdown
API Key: sk_live_abc123xyz...
```

---

## 🚨 If You Accidentally Commit a Secret

**IMMEDIATE ACTION:**
```bash
# 1. Revoke the credential immediately (rotate keys)
# 2. Remove from repo history
git filter-branch --tree-filter 'rm -f .env' HEAD
# 3. Force push (only if private - WE CAN'T do this on public repo)
# 4. Create new credentials with the rotated key
```

**For PUBLIC repos:** Secrets in git history are EXPOSED. Rotate immediately.

---

## 📋 Security Checklist (Before Every Commit)

- [ ] No `.env` files in `git status`
- [ ] No API keys in code
- [ ] No private business data in docs
- [ ] No personal credentials
- [ ] No database passwords
- [ ] No internal strategy/revenue numbers
- [ ] No prompt injection in code comments
- [ ] Run: `git diff --cached` (verify diff looks safe)

---

## 🎯 What's Safe to Commit

✅ **Public information:**
- Architecture diagrams
- Public API documentation
- LMSYS benchmark data (it's public RSS)
- General implementation guides
- Error handling strategies
- UI component structure

✅ **Configuration templates:**
- `.env.example` (with placeholder values)
- `config.template.js` (with `YOUR_VALUE` placeholders)

✅ **Code without secrets:**
- Business logic
- Data parsing
- API routing logic

---

## 🔐 GitHub-Specific

### Repository Settings
- ✅ Enable "Secret scanning" (Settings → Security)
- ✅ Enable "Branch protection" on main (require reviews)
- ✅ Disable "Push" on main (only PR merges)

### If Secrets Are Found
GitHub automatically notifies if it detects:
- AWS keys
- Stripe keys
- Database credentials
- OAuth tokens

**Act immediately** if GitHub alerts you.

---

## 🚀 Deployment Secrets (Vercel/Supabase)

**DO NOT add to repo.** Instead:
1. Store in platform's environment variables
   - Vercel: Settings → Environment Variables
   - Supabase: Settings → API Keys
2. Reference in code:
   ```javascript
   const key = process.env.STRIPE_SECRET_KEY;
   ```
3. Platform injects at runtime (never stored in git)

---

## 💡 Prompt Injection Protection

Since this is code + docs, protect against injection:

❌ **UNSAFE:**
```javascript
// User can inject: "); console.log(secrets);
const query = `SELECT * FROM users WHERE name = "${userName}"`;
```

✅ **SAFE:**
```javascript
// Use parameterized queries
const query = 'SELECT * FROM users WHERE name = $1';
db.query(query, [userName]);
```

For documentation, avoid:
- Inline code snippets that users copy-paste blindly
- Examples that show how to bypass security
- Instructions that ask users to paste secrets

---

## 📞 Incident Response

If you discover a security issue:

1. **DO NOT** commit a fix that reveals the problem
2. **DO NOT** create a public GitHub issue about it
3. **DO** contact me immediately on WhatsApp
4. **DO** rotate credentials immediately
5. **DO** create a private fix in a separate branch

---

## Summary

**Golden Rule:** If it's something you wouldn't want in Slack or email to your team, don't put it in this public repo.

Questions? Ask before committing.
