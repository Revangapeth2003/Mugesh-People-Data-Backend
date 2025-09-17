// backend/models/user.model.ts - FIXED POSTGRESQL VERSION
import pool from '../config/db';
import bcrypt from 'bcryptjs';

export interface User {
  id?: number;
  email: string;
  password: string;
  role: 'admin' | 'superadmin';
  direction?: 'East' | 'West' | 'North' | 'South';
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class UserModel {
  // Create user
  static async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const client = await pool.connect();
    try {
      // Validate direction based on role
      if (userData.role === 'admin' && !userData.direction) {
        throw new Error('Direction is required for admin users');
      }
      
      // For superadmin users, direction should be null
      const direction = userData.role === 'superadmin' ? null : userData.direction;

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      const result = await client.query(
        `INSERT INTO users (email, password, role, direction, is_active) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [userData.email, hashedPassword, userData.role, direction, userData.is_active ?? true]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Find user by ID
  static async findById(id: number): Promise<User | null> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Compare password
  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get all users
  static async findAll(): Promise<User[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users ORDER BY created_at DESC');
      return result.rows;
    } finally {
      client.release();
    }
  }

  // ✅ FIXED: Update user with correct password hashing order
  static async updateById(id: number, updateData: Partial<User>): Promise<User | null> {
    const client = await pool.connect();
    try {
      // Validate direction based on role if role is being updated
      if (updateData.role === 'admin' && !updateData.direction) {
        throw new Error('Direction is required for admin users');
      }
      
      // For superadmin users, direction should be null
      if (updateData.role === 'superadmin') {
        updateData.direction = undefined;
      }

      // ✅ CRITICAL FIX: Hash password BEFORE creating values array
      if (updateData.password) {
        const saltRounds = 12;
        updateData.password = await bcrypt.hash(updateData.password, saltRounds);
        console.log('🔐 Password hashed before database update');
      }

      // NOW create fields and values arrays AFTER password is hashed
      const fields = Object.keys(updateData).filter(key => key !== 'id' && updateData[key as keyof User] !== undefined);
      const values = fields.map(field => updateData[field as keyof User]);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

      if (fields.length === 0) {
        return await this.findById(id);
      }

      console.log('🔄 Updating user with fields:', fields);

      const result = await client.query(
        `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      
      console.log('✅ Database update completed for user ID:', id);
      return result.rows[0] || null;
      
    } finally {
      client.release();
    }
  }

  // Delete user
  static async deleteById(id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
      return result.rowCount! > 0;
    } finally {
      client.release();
    }
  }
}
