# Quick Start - Propellex Platform

## 🚀 3-Step Setup

### 1️⃣ Install Dependencies
```bash
npm run install:all
```

### 2️⃣ Create Environment Files

**Windows PowerShell:**
```powershell
Copy-Item backend\env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

**Linux/Mac:**
```bash
cp backend/env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3️⃣ Update & Start

1. **Edit `backend/.env`** - Set `JWT_SECRET` and `MONGODB_URI`
2. **Start MongoDB** (local or use MongoDB Atlas)
3. **Run**: `npm run dev`

---

## ✅ Verify

- Backend: http://localhost:5000/health
- Frontend: http://localhost:3000
- API Docs: http://localhost:5000/api-docs

---

**That's it!** See `SETUP_INSTRUCTIONS.md` for detailed guide.




