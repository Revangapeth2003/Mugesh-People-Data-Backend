import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Fix: 'require' is not a valid property, use 'rejectUnauthorized'
  },
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    
    // Fix: Access database info from connection config instead of client.database
    const connectionInfo = await client.query('SELECT current_database() as database');
    console.log(`📊 Database: ${connectionInfo.rows[0].database}`);
    
    client.release();
    
    // Initialize database tables
    await initializeTables();
  } catch (error: any) {
    console.error('❌ PostgreSQL connection error:', error.message);
    process.exit(1);
  }
};

// Initialize all database tables
async function initializeTables() {
  const client = await pool.connect();
  
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'superadmin')),
        direction VARCHAR(10) CHECK (direction IN ('East', 'West', 'North', 'South')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT direction_required_for_admin CHECK (
          (role = 'admin' AND direction IS NOT NULL) OR 
          (role = 'superadmin')
        )
      );
    `);

    // Create people table
    await client.query(`
      CREATE TABLE IF NOT EXISTS people (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        age INTEGER NOT NULL CHECK (age >= 1 AND age <= 120),
        phone VARCHAR(10) UNIQUE NOT NULL CHECK (phone ~ '^[0-9]{10}$'),
        address TEXT NOT NULL,
        ward VARCHAR(255) NOT NULL,
        street VARCHAR(255) NOT NULL,
        direction VARCHAR(10) NOT NULL CHECK (direction IN ('East', 'West', 'North', 'South')),
        aadhar_number VARCHAR(12) UNIQUE NOT NULL CHECK (aadhar_number ~ '^[0-9]{12}$'),
        pan_number VARCHAR(10) UNIQUE NOT NULL CHECK (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
        voter_id_number VARCHAR(10) UNIQUE CHECK (voter_id_number ~ '^[A-Z]{3}[0-9]{7}$'),
        gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
        religion VARCHAR(255) NOT NULL,
        caste VARCHAR(255) NOT NULL,
        community VARCHAR(10) NOT NULL CHECK (community IN ('General', 'OBC', 'SC', 'ST', 'Other')),
        created_by VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ✅ CRITICAL: Messages table with proper constraints
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        direction VARCHAR(10),
        template_id INTEGER REFERENCES templates(id) ON DELETE SET NULL,
        recipients INTEGER[] DEFAULT '{}',
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'sent',
        delivery_report JSONB DEFAULT '[]',
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_people_direction ON people(direction);
      CREATE INDEX IF NOT EXISTS idx_people_created_by ON people(created_by);
      CREATE INDEX IF NOT EXISTS idx_people_created_at ON people(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
      CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
      CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by);
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database table initialization failed:', error);
  } finally {
    client.release();
  }
}

export default pool;
