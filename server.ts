import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import personRoutes from './routes/person.routes';
import userRoutes from './routes/user.routes';
import messageRoutes from './routes/message.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Helper function for error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

// CORS Configuration - Updated for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || 'https://your-frontend-name.netlify.app',
        'https://mugesh-people-data-backend-wa48.vercel.app'
      ]
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test database route with proper error handling
app.get('/test-db-insert', async (req, res) => {
  try {
    // Set timeout to prevent Vercel function timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 5000);
    });

    // Your database test logic here
    const testOperation = async () => {
      // Example: Test database connection
      // const result = await pool.query('SELECT NOW() as current_time');
      return { 
        success: true, 
        message: 'Database connection test completed',
        timestamp: new Date().toISOString()
      };
    };

    // Race between operation and timeout
    const result = await Promise.race([testOperation(), timeoutPromise]);
    
    res.json(result);
    
  } catch (error) {
    console.error('Database test error:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Database test failed', 
      error: getErrorMessage(error)
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/people', personRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: '🏛️ Election Commission Backend Server Running!',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL (Neon)',
    environment: process.env.NODE_ENV || 'development',
    routes: {
      auth: '/api/auth',
      people: '/api/people',
      users: '/api/users',
      messages: '/api/messages',
      testDB: '/test-db-insert'
    }
  });
});

// Debug route for testing
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'All routes registered successfully',
    routes: {
      'POST /api/auth/register': 'Register new user',
      'POST /api/auth/login': 'User login',
      'GET /api/auth/verify': 'Verify JWT token',
      'GET /api/people': 'Get people data (protected)',
      'POST /api/people': 'Add person data (protected)',
      'GET /api/users': 'Get users (protected)',
      'GET /api/messages': 'Get sent messages (protected)',
      'POST /api/messages': 'Send new message (protected)',
      'GET /test-db-insert': 'Test database connection'
    },
    database: 'PostgreSQL (Neon)',
    environment: process.env.NODE_ENV || 'development',
    cors: process.env.NODE_ENV === 'production' ? 'Production CORS enabled' : 'Development CORS enabled'
  });
});

// Catch-all route for undefined endpoints
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      'GET /': 'Health check',
      'GET /api/debug': 'Debug information',
      'POST /api/auth/register': 'User registration',
      'POST /api/auth/login': 'User login',
      'GET /api/people': 'Get people (requires auth)',
      'GET /api/users': 'Get users (requires auth)',
      'GET /api/messages': 'Get messages (requires auth)',
      'GET /test-db-insert': 'Database test'
    }
  });
});

// Database initialization
const initializeApp = async () => {
  try {
    await connectDB();
    console.log('🗄️ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', getErrorMessage(error));
    // Don't exit process on Vercel, just log the error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Initialize database connection
initializeApp();

// Export for Vercel serverless deployment
export default app;

// Local development server (only runs locally)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('🚀 ============================================');
    console.log(`🏛️  ELECTION COMMISSION BACKEND SERVER`);
    console.log('🚀 ============================================');
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`📡 API Base: http://localhost:${PORT}/api`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`👥 People API: http://localhost:${PORT}/api/people`);
    console.log(`👤 Users API: http://localhost:${PORT}/api/users`);
    console.log(`💬 Messages API: http://localhost:${PORT}/api/messages`);
    console.log(`🧪 Test DB: http://localhost:${PORT}/test-db-insert`);
    console.log(`🗄️  Database: PostgreSQL (Neon)`);
    console.log('🚀 ============================================');
  });
}
