# Propellex Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Set Up Environment Variables

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/propellex
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start MongoDB
Make sure MongoDB is running locally or update `MONGODB_URI` to your MongoDB Atlas connection string.

### 4. Run the Application
```bash
# Run both frontend and backend together
npm run dev

# Or run separately:
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:5000
```

## Application Structure

### Admin Portal (`/admin`)
- Dashboard with statistics
- Add/Edit/Delete properties
- Manage property listings

### Client Portal (`/search`)
- Search properties with filters
- Compare up to 4 properties
- View detailed property information

## Features Implemented

✅ User Authentication (Admin/Client roles)
✅ Property Management (CRUD operations)
✅ Advanced Search with Filters
✅ Property Comparison Tool
✅ Responsive UI with Tailwind CSS
✅ TypeScript for type safety
✅ RESTful API with Express
✅ MongoDB database with Mongoose
✅ JWT authentication
✅ Protected routes

## Next Steps

1. **Install dependencies**: `npm run install:all`
2. **Set up MongoDB**: Install MongoDB locally or use MongoDB Atlas
3. **Configure environment**: Copy `.env.example` files and update values
4. **Run the app**: `npm run dev`
5. **Create an admin account**: Register with role "admin"
6. **Add properties**: Use the admin portal to add properties
7. **Search and compare**: Use the client portal to search and compare properties

## Troubleshooting

- **Port already in use**: Change PORT in backend/.env
- **MongoDB connection error**: Check MONGODB_URI in backend/.env
- **CORS errors**: Ensure frontend URL matches CORS_ORIGIN in backend/.env
- **Module not found**: Run `npm install` in both frontend and backend directories




