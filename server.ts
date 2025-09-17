import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import pool from './config/db';
import authRoutes from './routes/auth.routes';
import personRoutes from './routes/person.routes';
import userRoutes from './routes/user.routes';
import messageRoutes from './routes/message.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test database route
app.get('/test-db-insert', async (req, res) => {
  // Your existing test code here
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/people', personRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: '🏛️ Election Commission Backend Server Running!',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL (Neon)',
    routes: {
      auth: '/api/auth',
      people: '/api/people',
      users: '/api/users',
      messages: '/api/messages',
      testDB: '/test-db-insert'
    }
  });
});

// Debug route
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'All routes registered successfully',
    routes: {
      'POST /api/auth/register': 'Register new user',
      'POST /api/auth/login': 'User login',
      'GET /api/auth/verify': 'Verify JWT token',
      'GET /api/messages': 'Get sent messages',
      'POST /api/messages': 'Send new message',
      'GET /test-db-insert': 'Test database insert'
    },
    database: 'PostgreSQL (Neon) Connected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ FIXED: Catch-all route for Express v5 (if you need one)
app.all('/*splat', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
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
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
