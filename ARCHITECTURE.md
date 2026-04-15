# Propellex - HNI Property Investment Platform Architecture

## Overview
Azure-native platform for High Net Worth Individual (HNI) property investment in India, supporting multi-city operations with enterprise-grade security and scalability.

## System Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB (with Azure Cosmos DB support)
- **Cloud**: Microsoft Azure
- **Authentication**: Azure AD B2C + JWT
- **Storage**: Azure Blob Storage
- **Cache**: Azure Redis Cache
- **Search**: Azure Cognitive Search
- **Monitoring**: Azure Application Insights

## Modular Architecture

### 1. Property Discovery Module
**Purpose**: Advanced property search and discovery for HNI investors
- Multi-city property search
- Advanced filtering (price range, location, amenities, ROI)
- Property recommendations based on investment profile
- Virtual tours and 360° views
- Property comparison tools
- Investment analytics preview

**Components**:
- Property search service
- Recommendation engine
- Filter service
- Comparison service

### 2. Investor Dashboard Module
**Purpose**: Comprehensive dashboard for HNI investors
- Portfolio overview
- Investment performance tracking
- ROI analytics
- Property watchlist
- Investment history
- Document management
- Market trends visualization

**Components**:
- Dashboard service
- Analytics service
- Portfolio service
- Document service

### 3. Agency Management Module
**Purpose**: Management portal for real estate agencies
- Agency profile management
- Agent management
- Property listing management
- Lead management
- Performance metrics
- Commission tracking

**Components**:
- Agency service
- Agent service
- Listing service
- Lead service

### 4. Market Intelligence Module
**Purpose**: Real-time market data and insights
- Market trends analysis
- Price predictions
- Area-wise analytics
- Investment recommendations
- Market reports
- Comparative market analysis (CMA)

**Components**:
- Market data service
- Analytics service
- Prediction service
- Report service

### 5. Compliance Management Module
**Purpose**: Regulatory compliance and documentation
- Legal document management
- Compliance checklist
- Regulatory updates
- Document verification
- Audit trails
- Compliance reporting

**Components**:
- Compliance service
- Document service
- Audit service
- Verification service

### 6. User Authentication Module
**Purpose**: Secure authentication and authorization
- Multi-role authentication (HNI Investor, Agency Admin, Compliance Officer, Product Manager)
- Azure AD B2C integration
- Role-based access control (RBAC)
- Session management
- Two-factor authentication (2FA)
- Password policies

**Components**:
- Auth service
- Role service
- Permission service
- Session service

### 7. Inquiry Management Module
**Purpose**: Lead and inquiry management
- Inquiry tracking
- Lead scoring
- Follow-up management
- Communication history
- Inquiry analytics
- Automated workflows

**Components**:
- Inquiry service
- Lead service
- Communication service
- Workflow service

## User Roles

### 1. HNI Investor
- Access to property discovery
- View investor dashboard
- Manage portfolio
- Access market intelligence
- Submit inquiries
- View compliance documents

### 2. Agency Admin
- Manage agency profile
- Manage agents
- Manage property listings
- View agency dashboard
- Manage inquiries
- Access market intelligence

### 3. Compliance Officer
- Manage compliance documents
- Verify documents
- Generate compliance reports
- Access audit trails
- Manage regulatory updates

### 4. Product Manager
- Full system access
- Manage all modules
- System configuration
- User management
- Analytics and reporting

## Database Schema

### Core Collections
- `users` - User accounts with roles
- `properties` - Property listings
- `agencies` - Real estate agencies
- `agents` - Real estate agents
- `investments` - Investment records
- `inquiries` - Lead inquiries
- `documents` - Document storage metadata
- `compliance_records` - Compliance tracking
- `market_data` - Market intelligence data
- `notifications` - User notifications

## Azure Services Integration

### Required Azure Services
1. **Azure App Service** - Hosting backend API
2. **Azure Static Web Apps** - Frontend hosting
3. **Azure Cosmos DB** - Database (MongoDB API)
4. **Azure Blob Storage** - File storage
5. **Azure Redis Cache** - Caching layer
6. **Azure Cognitive Search** - Search functionality
7. **Azure AD B2C** - Authentication
8. **Azure Application Insights** - Monitoring
9. **Azure Key Vault** - Secrets management
10. **Azure Functions** - Serverless functions

## Security Features

- Azure AD B2C authentication
- JWT token-based authorization
- Role-based access control (RBAC)
- API rate limiting
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- HTTPS enforcement
- Secrets management via Azure Key Vault
- Audit logging

## Scalability Features

- Microservices-ready architecture
- Horizontal scaling support
- Caching layer (Redis)
- CDN integration
- Database indexing
- API pagination
- Background job processing
- Load balancing ready

## Multi-City Support

- City-based property filtering
- Multi-currency support (INR primary)
- Location-based search
- City-specific market data
- Regional compliance rules
- Timezone handling

## Project Structure

```
propellex-hni-platform/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   │   ├── property-discovery/
│   │   │   ├── investor-dashboard/
│   │   │   ├── agency-management/
│   │   │   ├── market-intelligence/
│   │   │   ├── compliance-management/
│   │   │   ├── inquiry-management/
│   │   │   └── auth/
│   │   ├── shared/         # Shared components
│   │   ├── services/       # API services
│   │   └── utils/          # Utilities
├── backend/                 # Express backend
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   │   ├── property-discovery/
│   │   │   ├── investor-dashboard/
│   │   │   ├── agency-management/
│   │   │   ├── market-intelligence/
│   │   │   ├── compliance-management/
│   │   │   ├── inquiry-management/
│   │   │   └── auth/
│   │   ├── shared/         # Shared utilities
│   │   ├── config/         # Configuration
│   │   └── middleware/     # Express middleware
├── shared/                  # Shared TypeScript types
│   ├── src/
│   │   ├── types/          # TypeScript types
│   │   ├── constants/     # Constants
│   │   └── utils/         # Shared utilities
├── infrastructure/         # Azure infrastructure
│   ├── arm-templates/     # ARM templates
│   ├── bicep/             # Bicep templates
│   └── scripts/           # Deployment scripts
└── docs/                  # Documentation
```

## Development Guidelines

### Code Organization
- Modular architecture with clear boundaries
- Shared types in `shared` package
- Feature-based folder structure
- Separation of concerns

### API Design
- RESTful API design
- Consistent response format
- API versioning
- Comprehensive error handling

### Testing
- Unit tests for business logic
- Integration tests for APIs
- E2E tests for critical flows
- Test coverage > 80%

### Documentation
- API documentation (OpenAPI/Swagger)
- Code comments for complex logic
- Architecture decision records (ADRs)
- Deployment guides




