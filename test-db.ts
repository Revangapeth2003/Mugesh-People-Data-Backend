import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool: Pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { 
    rejectUnauthorized: false  // Fix: Remove 'require: true' - it's not a valid property
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

interface TestMessage {
  id?: number;
  sender_id: number;
  message: string;
  status: string;
  recipients: number[];
  delivery_report: string;
  sent_at: Date;
}

async function testDatabase(): Promise<void> {
  console.log('🧪 Testing TypeScript database connection...');
  
  const client = await pool.connect();
  try {
    // Test 1: Basic connection
    const timeResult: QueryResult = await client.query('SELECT NOW() as current_time');
    console.log('✅ Connection successful:', timeResult.rows[0]);
    
    // Test 2: Check if messages table exists
    const tableCheck: QueryResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
      );
    `);
    console.log('📋 Messages table exists:', tableCheck.rows[0].exists);
    
    // Test 3: Simple insert with transaction
    await client.query('BEGIN');
    const insertResult: QueryResult<TestMessage> = await client.query(`
      INSERT INTO messages (sender_id, message, status, recipients, delivery_report, sent_at) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `, [1, 'Test message from TypeScript', 'sent', [1,2], JSON.stringify([{personId:'1',status:'pending'}]), new Date()]);
    await client.query('COMMIT');
    
    console.log('✅ Insert test successful:', insertResult.rows[0]);
    
    // Test 4: Verify data is actually saved
    const selectResult: QueryResult = await client.query('SELECT * FROM messages WHERE message = $1', ['Test message from TypeScript']);
    console.log('✅ Data verification:', selectResult.rows.length > 0 ? 'FOUND' : 'NOT FOUND');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testDatabase();

export default pool;
