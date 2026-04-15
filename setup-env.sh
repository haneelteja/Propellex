#!/bin/bash
# Propellex Platform - Environment Setup Script
# This script creates .env files from examples

echo "🚀 Setting up Propellex environment files..."

# Create backend .env
if [ -f "backend/env.example" ]; then
    if [ ! -f "backend/.env" ]; then
        cp backend/env.example backend/.env
        echo "✅ Created backend/.env"
        
        # Generate JWT_SECRET
        JWT_SECRET=$(openssl rand -hex 32)
        if [ -n "$JWT_SECRET" ]; then
            sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" backend/.env
            rm backend/.env.bak 2>/dev/null
            echo "✅ Generated JWT_SECRET"
        fi
    else
        echo "⚠️  backend/.env already exists, skipping..."
    fi
else
    echo "❌ backend/env.example not found!"
fi

# Create frontend .env
if [ -f "frontend/.env.example" ]; then
    if [ ! -f "frontend/.env" ]; then
        cp frontend/.env.example frontend/.env
        echo "✅ Created frontend/.env"
    else
        echo "⚠️  frontend/.env already exists, skipping..."
    fi
else
    echo "❌ frontend/.env.example not found!"
fi

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Review backend/.env and update MONGODB_URI if needed"
echo "   2. Run: npm run install:all"
echo "   3. Start MongoDB"
echo "   4. Run: npm run dev"




