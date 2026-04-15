# Propellex - HNI Property Investment Platform

Azure-native platform for High Net Worth Individual (HNI) property investment in India, supporting multi-city operations with enterprise-grade security and scalability.

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB / Azure Cosmos DB
- **Cloud**: Microsoft Azure
- **Authentication**: Azure AD B2C + JWT
- **Storage**: Azure Blob Storage
- **Cache**: Azure Redis Cache
- **Search**: Azure Cognitive Search

## 📦 Modules

1. **Property Discovery** - Advanced property search and discovery
2. **Investor Dashboard** - Portfolio management and analytics
3. **Agency Management** - Agency and agent management
4. **Market Intelligence** - Real-time market data and insights
5. **Compliance Management** - Regulatory compliance tracking
6. **User Authentication** - Multi-role authentication system
7. **Inquiry Management** - Lead and inquiry tracking

## 👥 User Roles

- **HNI Investor** - Property investors
- **Agency Admin** - Real estate agency administrators
- **Compliance Officer** - Compliance and regulatory management
- **Product Manager** - Full system access

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Azure Cosmos DB)
- Azure account (for cloud deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/haneelteja/Propellex.git
   cd Propellex
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   Backend (`backend/.env`):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/propellex
   JWT_SECRET=your-secret-key
   JWT_EXPIRE=7d
   ```
   
   Frontend (`frontend/.env`):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Docs: http://localhost:5000/api-docs

## 📁 Project Structure

```
propellex-hni-platform/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── modules/      # Feature modules
│   │   ├── shared/       # Shared components
│   │   └── services/     # API services
├── backend/              # Express backend API
│   ├── src/
│   │   ├── modules/      # Feature modules
│   │   ├── shared/       # Shared utilities
│   │   └── config/       # Configuration
├── shared/                # Shared TypeScript types
│   └── src/
│       ├── types/        # TypeScript types
│       ├── constants/    # Constants
│       └── utils/        # Utilities
├── infrastructure/        # Azure infrastructure
│   ├── arm-templates/    # ARM templates
│   └── scripts/          # Deployment scripts
└── docs/                 # Documentation
```

## 🔐 Security Features

- Azure AD B2C authentication
- JWT token-based authorization
- Role-based access control (RBAC)
- API rate limiting
- Input validation and sanitization
- HTTPS enforcement
- Secrets management via Azure Key Vault

## 📊 Features

### Property Discovery
- Multi-city property search
- Advanced filtering
- Property recommendations
- Virtual tours
- Property comparison

### Investor Dashboard
- Portfolio overview
- Investment performance tracking
- ROI analytics
- Property watchlist
- Document management

### Market Intelligence
- Market trends analysis
- Price predictions
- Area-wise analytics
- Investment recommendations
- Market reports

### Compliance Management
- Legal document management
- Compliance checklist
- Regulatory updates
- Document verification
- Audit trails

## 🌍 Multi-City Support

- City-based property filtering
- Multi-currency support (INR primary)
- Location-based search
- City-specific market data
- Regional compliance rules

## 📚 Documentation

- [Architecture Documentation](./ARCHITECTURE.md)
- [Azure Setup Guide](./infrastructure/azure-setup.md)
- [API Documentation](http://localhost:5000/api-docs) (when running)

## 🧪 Testing

```bash
npm test
```

## 🚢 Deployment

See [Azure Infrastructure Setup Guide](./infrastructure/azure-setup.md) for deployment instructions.

## 📝 License

MIT License

## 👤 Author

Haneel Teja

---

**Built with ❤️ for HNI property investment in India**
