# Propellex Platform - Setup Instructions

## Quick Setup Guide

Follow these steps to get your development environment running:

### Step 1: Install Dependencies

Open your terminal in the project root and run:

```bash
npm run install:all
```

This will install dependencies for:
- Root workspace
- Shared package
- Frontend
- Backend

**Alternative (if the above doesn't work):**
```bash
npm install
cd shared && npm install && cd ..
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### Step 2: Create Environment Files

#### Backend Environment
Create `backend/.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - MongoDB or Azure Cosmos DB
MONGODB_URI=mongodb://localhost:27017/propellex

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Quick copy command (Windows PowerShell):**
```powershell
Copy-Item backend\env.example backend\.env
```

#### Frontend Environment
Create `frontend/.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Application Configuration
VITE_APP_NAME=Propellex
VITE_APP_VERSION=2.0.0
```

**Quick copy command (Windows PowerShell):**
```powershell
Copy-Item frontend\.env.example frontend\.env
```

### Step 3: Update Environment Variables

**Important:** Update these values in `backend/.env`:

1. **JWT_SECRET**: Generate a secure random string (minimum 32 characters)
   ```bash
   # You can use Node.js to generate one:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **MONGODB_URI**: 
   - For local MongoDB: `mongodb://localhost:27017/propellex`
   - For MongoDB Atlas: Your connection string
   - For Azure Cosmos DB: Your Cosmos DB connection string

### Step 4: Start MongoDB

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is installed and running
mongod
```

**Option B: MongoDB Atlas (Cloud)**
- Create account at https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get connection string
- Update `MONGODB_URI` in `backend/.env`

**Option C: Docker**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 5: Start Development Servers

Run both frontend and backend:

```bash
npm run dev
```

This will start:
- **Backend API**: http://localhost:5000
- **Frontend App**: http://localhost:3000
- **API Documentation**: http://localhost:5000/api-docs

**Or run separately:**

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### Step 6: Verify Installation

1. **Check Backend**: Visit http://localhost:5000/health
   - Should return: `{"status":"ok",...}`

2. **Check Frontend**: Visit http://localhost:3000
   - Should show login page

3. **Check API Docs**: Visit http://localhost:5000/api-docs
   - Should show Swagger documentation

### Step 7: Create Test User

1. Go to http://localhost:3000/register
2. Register with any role:
   - **HNI Investor** - For property investment features
   - **Agency Admin** - For agency management
   - **Compliance Officer** - For compliance management
   - **Product Manager** - Full access

3. Login and explore the dashboard

---

## Troubleshooting

### Issue: Port Already in Use
**Solution**: Change port in `backend/.env`:
```env
PORT=5001
```

### Issue: MongoDB Connection Error
**Solutions**:
1. Check if MongoDB is running: `mongosh` or `mongo`
2. Verify connection string in `backend/.env`
3. Check firewall settings

### Issue: Module Not Found Errors
**Solution**: 
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json
rm -rf shared/node_modules shared/package-lock.json
npm run install:all
```

### Issue: TypeScript Errors
**Solution**: 
```bash
# Build shared package first
cd shared && npm run build && cd ..
```

### Issue: CORS Errors
**Solution**: Update `CORS_ORIGIN` in `backend/.env` to match your frontend URL

---

## Development Workflow

1. **Make changes** to code
2. **Hot reload** will automatically refresh (Vite for frontend, tsx watch for backend)
3. **Check console** for errors
4. **Test API** using Swagger docs or Postman

---

## Next Development Steps

After setup is complete, you can:

1. **Implement module logic** - Each module has placeholder controllers ready
2. **Add database models** - Extend existing models as needed
3. **Create API endpoints** - Implement business logic in controllers
4. **Build UI components** - Enhance frontend pages
5. **Add tests** - Write unit and integration tests

---

## Need Help?

- Check `README.md` for project overview
- Check `ARCHITECTURE.md` for system architecture
- Check `VERIFICATION_REPORT.md` for what's been set up
- Check `PROJECT_INITIALIZATION.md` for initialization details

---

**Ready to start coding!** 🚀




