// scripts/fixUsersConstraint.ts
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { 
    rejectUnauthorized: false // Fix: Use 'rejectUnauthorized' instead of 'require'
  },
});

async function fixUsersConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing users table constraint for superadmin...');
    
    // Drop any existing direction constraints
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS direction_required_for_admin;
    `);
    
    // Add the correct constraint that allows superadmin without direction
    await client.query(`
      ALTER TABLE users ADD CONSTRAINT direction_required_for_admin CHECK (
        (role = 'admin' AND direction IS NOT NULL) OR 
        (role = 'superadmin')
      );
    `);
    
    console.log('✅ Users table constraint fixed successfully');
    
  } catch (error) {
    console.error('❌ Failed to fix users table:', error);
  } finally {
    client.release();
    pool.end();
  }
}

fixUsersConstraint();
