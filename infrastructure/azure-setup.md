# Azure Infrastructure Setup Guide

## Required Azure Services

### 1. Azure App Service
- **Purpose**: Host backend API
- **Tier**: Standard or Premium (for production)
- **Configuration**:
  - Node.js 18 LTS runtime
  - Always On: Enabled
  - HTTPS Only: Enabled

### 2. Azure Static Web Apps
- **Purpose**: Host frontend React application
- **Configuration**:
  - Framework: React
  - Build command: `npm run build`
  - Output location: `dist`

### 3. Azure Cosmos DB (MongoDB API)
- **Purpose**: Primary database
- **Configuration**:
  - API: MongoDB
  - Consistency level: Session
  - Throughput: Auto-scale (400-4000 RU/s)

### 4. Azure Blob Storage
- **Purpose**: Store property images and documents
- **Configuration**:
  - Storage account type: Standard LRS
  - Access tier: Hot
  - Containers:
    - `property-images`
    - `property-documents`
    - `user-avatars`

### 5. Azure Redis Cache
- **Purpose**: Caching layer for improved performance
- **Configuration**:
  - Tier: Standard C1 (1GB) or higher
  - Eviction policy: AllKeysLRU

### 6. Azure Cognitive Search
- **Purpose**: Advanced property search functionality
- **Configuration**:
  - Tier: Basic or Standard
  - Index: properties-index

### 7. Azure AD B2C
- **Purpose**: User authentication
- **Configuration**:
  - User flows for sign-up/sign-in
  - Custom policies for role-based access

### 8. Azure Application Insights
- **Purpose**: Application monitoring and analytics
- **Configuration**:
  - Enable performance monitoring
  - Enable dependency tracking
  - Enable exception tracking

### 9. Azure Key Vault
- **Purpose**: Secure storage of secrets and certificates
- **Configuration**:
  - Store: JWT secrets, database connection strings, API keys

### 10. Azure Functions (Optional)
- **Purpose**: Serverless functions for background jobs
- **Use cases**:
  - Email notifications
  - Market data updates
  - Compliance checks

## Environment Variables

### Backend (.env)
```env
# Azure Configuration
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_RESOURCE_GROUP=propellex-rg
AZURE_LOCATION=centralindia

# Database
AZURE_COSMOS_DB_CONNECTION_STRING=your-cosmos-db-connection-string
MONGODB_URI=your-cosmos-db-connection-string

# Storage
AZURE_STORAGE_ACCOUNT_NAME=propellexstorage
AZURE_STORAGE_ACCOUNT_KEY=your-storage-key
AZURE_STORAGE_CONNECTION_STRING=your-storage-connection-string

# Redis
AZURE_REDIS_HOST=propellex-redis.redis.cache.windows.net
AZURE_REDIS_PORT=6380
AZURE_REDIS_KEY=your-redis-key

# Key Vault
AZURE_KEY_VAULT_NAME=propellex-keyvault
AZURE_KEY_VAULT_SECRET=your-jwt-secret

# Application Insights
AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING=your-app-insights-connection-string

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=https://your-frontend-url.azurestaticapps.net
```

### Frontend (.env)
```env
VITE_API_URL=https://propellex-api.azurewebsites.net/api
VITE_AZURE_AD_B2C_TENANT=your-tenant-name
VITE_AZURE_AD_B2C_CLIENT_ID=your-client-id
```

## Deployment Steps

1. **Create Resource Group**
   ```bash
   az group create --name propellex-rg --location centralindia
   ```

2. **Deploy Cosmos DB**
   ```bash
   az cosmosdb create --name propellex-db --resource-group propellex-rg --kind MongoDB
   ```

3. **Deploy Storage Account**
   ```bash
   az storage account create --name propellexstorage --resource-group propellex-rg --location centralindia --sku Standard_LRS
   ```

4. **Deploy Redis Cache**
   ```bash
   az redis create --name propellex-redis --resource-group propellex-rg --location centralindia --sku Basic --vm-size c0
   ```

5. **Deploy App Service**
   ```bash
   az webapp create --name propellex-api --resource-group propellex-rg --plan propellex-plan --runtime "NODE:18-lts"
   ```

6. **Deploy Static Web App**
   ```bash
   az staticwebapp create --name propellex-frontend --resource-group propellex-rg --location centralindia
   ```

## Cost Estimation (Monthly)

- Azure App Service (Standard S1): ~$70
- Azure Static Web Apps (Standard): ~$9
- Cosmos DB (400 RU/s): ~$25
- Azure Blob Storage (100GB): ~$2
- Redis Cache (C1): ~$55
- Cognitive Search (Basic): ~$250
- Application Insights: ~$10
- **Total**: ~$421/month (estimated)

## Security Best Practices

1. Enable HTTPS for all services
2. Use Managed Identities for Azure service authentication
3. Store secrets in Azure Key Vault
4. Enable firewall rules for Cosmos DB
5. Use Private Endpoints for sensitive services
6. Enable Azure AD authentication for management
7. Regular security audits and updates




