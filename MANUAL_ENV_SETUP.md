# Manual Environment Setup Guide

Since `.env` files are protected, please create them manually:

## Step 1: Create Backend .env File

Create a file named `.env` in the `backend/` folder with this content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - MongoDB or Azure Cosmos DB
MONGODB_URI=mongodb://localhost:27017/propellex

# JWT Authentication
JWT_SECRET=propellex-super-secret-jwt-key-2024-change-in-production-min-32-chars-required
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# CORS
CORS_ORIGIN=http://localhost:3000

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Quick Copy Method:**
1. Open `backend/env.example`
2. Copy all content
3. Create new file `backend/.env`
4. Paste the content
5. Update `JWT_SECRET` with a secure random string

## Step 2: Create Frontend .env File

Create a file named `.env` in the `frontend/` folder with this content:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Application Configuration
VITE_APP_NAME=Propellex
VITE_APP_VERSION=2.0.0
```

**Quick Copy Method:**
1. The frontend/.env.example should exist (if not, use the content above)
2. Copy content from `frontend/.env.example`
3. Create new file `frontend/.env`
4. Paste the content

## Step 3: Generate Secure JWT Secret (Optional but Recommended)

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Using Online Tool:**
- Visit: https://www.random.org/strings/
- Generate a 64-character random string

Then update `JWT_SECRET` in `backend/.env` with the generated value.

## Verification

After creating both files, verify they exist:
- ✅ `backend/.env` exists
- ✅ `frontend/.env` exists

## Next Step

Once both `.env` files are created, proceed to **Step 2: Install Dependencies**

```bash
npm run install:all
```

---

**Files created manually? Proceed to Step 2!** ✅



