import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import { initializeDatabase } from './config/dbInitializer.js';

// Import routers
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import customersRouter from './routes/customers.js';
import suppliersRouter from './routes/suppliers.js';
import purchasesRouter from './routes/purchases.js';
import salesRouter from './routes/sales.js';
import stocksRouter from './routes/stocks.js';
import accountsRouter from './routes/accounts.js';
import notificationsRouter from './routes/notifications.js';
import dashboardRouter from './routes/dashboard.js';
import reportsRouter from './routes/reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration (matches Spring Boot SecurityConfig)
app.use(cors({
  origin: (origin, callback) => {
    // Allows any origin (equivalent to setAllowedOriginPatterns("*")) with credentials
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
  exposedHeaders: ['Authorization'],
  credentials: true
}));

// Body parsing (matches Spring Boot max file sizes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// Register API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/sales', salesRouter);
app.use('/api/stocks', stocksRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date()
  });
});

// Database Sync and Server Startup
async function startServer() {
  try {
    // Authenticate and synchronize model definition with the database
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // We do not drop existing tables, we synchronize them (ddl-auto=update equivalent)
    await sequelize.sync({ alter: false });
    
    // Seed initial roles
    await initializeDatabase();

    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    } else {
      console.log('Running in Vercel Serverless environment.');
    }
  } catch (error) {
    console.error('Database connection / synchronization failed:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

startServer();

export default app;
