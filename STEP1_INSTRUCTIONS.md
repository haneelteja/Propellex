# Step 1: Environment Setup - Instructions

## ✅ Step 1 Status

The `.env` files are protected for security, so you need to create them manually.

## 📝 Quick Instructions

### Create Backend .env File

1. **Copy the template:**
   - Open `backend/env.example`
   - Copy all content

2. **Create new file:**
   - Create `backend/.env` (new file)
   - Paste the copied content

3. **Update JWT_SECRET:**
   - Generate a secure random string (64 characters)
   - Replace the `JWT_SECRET` value in `backend/.env`

### Create Frontend .env File

1. **Copy the template:**
   - Open `frontend/.env.example` (just created)
   - Copy all content

2. **Create new file:**
   - Create `frontend/.env` (new file)
   - Paste the copied content

## 🔑 Generate JWT Secret

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Using PowerShell**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Option 3: Use Online Generator**
- Visit: https://www.random.org/strings/
- Generate: 64-character random string

## ✅ Verification

After creating both files, you should have:
- ✅ `backend/.env` (with JWT_SECRET updated)
- ✅ `frontend/.env`

## 🎯 Next Step

Once both `.env` files are created, proceed to:

**Step 2: Install Dependencies**
```bash
npm run install:all
```

---

**Need help?** See `MANUAL_ENV_SETUP.md` for detailed instructions.



