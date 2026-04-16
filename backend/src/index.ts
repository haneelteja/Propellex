import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

// Import routes
import authRoutes from './modules/auth/routes/auth.routes.js'
import propertyRoutes from './modules/property-discovery/routes/property.routes.js'
import investorRoutes from './modules/investor-dashboard/routes/investor.routes.js'
import agencyRoutes from './modules/agency-management/routes/agency.routes.js'
import marketRoutes from './modules/market-intelligence/routes/market.routes.js'
import complianceRoutes from './modules/compliance-management/routes/compliance.routes.js'
import inquiryRoutes from './modules/inquiry-management/routes/inquiry.routes.js'

// Import middleware
import { errorHandler } from './shared/middleware/errorHandler.middleware.js'
import { notFoundHandler } from './shared/middleware/notFound.middleware.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || 'development'

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Propellex HNI Property Investment Platform API',
      version: '2.0.0',
      description: 'Azure-native platform for HNI property investment in India',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/**/*.routes.ts', './src/**/*.controller.ts'],
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

// Middleware
app.use(helmet())
app.use(compression())
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'))
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'capacitor://localhost',   // Capacitor Android/iOS
  'http://localhost',        // Capacitor fallback
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : []),
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})

app.use('/api/', limiter)

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '2.0.0',
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/investor', investorRoutes)
app.use('/api/agency', agencyRoutes)
app.use('/api/market', marketRoutes)
app.use('/api/compliance', complianceRoutes)
app.use('/api/inquiries', inquiryRoutes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.AZURE_COSMOS_DB_CONNECTION_STRING || 'mongodb://localhost:27017/propellex'

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB/Cosmos DB')
  })
  .catch((error) => {
    console.error('❌ Database connection error:', error)
    process.exit(1)
  })

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Propellex API Server running on http://localhost:${PORT}`)
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`)
  console.log(`🌍 Environment: ${NODE_ENV}`)
})

export default app
