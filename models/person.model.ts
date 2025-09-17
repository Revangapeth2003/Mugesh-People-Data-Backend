// backend/models/person.model.ts - POSTGRESQL VERSION
import pool from '../config/db';

export interface Person {
  id?: number;
  name: string;
  age: number;
  phone: string;
  address: string;
  ward: string;
  street: string;
  direction: 'East' | 'West' | 'North' | 'South';
  aadhar_number: string;
  pan_number: string;
  voter_id_number?: string;
  gender: 'Male' | 'Female' | 'Other';
  religion: string;
  caste: string;
  community: 'General' | 'OBC' | 'SC' | 'ST' | 'Other';
  created_by: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class PersonModel {
  // Create person
  static async create(personData: Omit<Person, 'id' | 'created_at' | 'updated_at'>): Promise<Person> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO people (name, age, phone, address, ward, street, direction, 
         aadhar_number, pan_number, voter_id_number, gender, religion, caste, 
         community, created_by, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
         RETURNING *`,
        [
          personData.name, personData.age, personData.phone, personData.address,
          personData.ward, personData.street, personData.direction, personData.aadhar_number,
          personData.pan_number, personData.voter_id_number, personData.gender,
          personData.religion, personData.caste, personData.community, personData.created_by,
          personData.is_active ?? true
        ]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Find with filter and sorting
  static async find(filter: any = {}, sort: any = { created_at: -1 }): Promise<Person[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM people WHERE is_active = true';
      const values: any[] = [];
      let paramCount = 1;

      // Add direction filter if specified
      if (filter.direction) {
        query += ` AND direction = $${paramCount}`;
        values.push(filter.direction);
        paramCount++;
      }

      // Add created_by filter if specified
      if (filter.created_by) {
        query += ` AND created_by = $${paramCount}`;
        values.push(filter.created_by);
        paramCount++;
      }

      // Add sorting
      if (sort.created_at === -1) {
        query += ' ORDER BY created_at DESC';
      } else {
        query += ' ORDER BY created_at ASC';
      }

      const result = await client.query(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Find by aadhar number
  static async findByAadhar(aadharNumber: string): Promise<Person | null> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM people WHERE aadhar_number = $1', [aadharNumber]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Find by PAN number
  static async findByPAN(panNumber: string): Promise<Person | null> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM people WHERE pan_number = $1', [panNumber.toUpperCase()]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Find by phone number
  static async findByPhone(phone: string): Promise<Person | null> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM people WHERE phone = $1', [phone]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Find by voter ID
  static async findByVoterID(voterIdNumber: string): Promise<Person | null> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM people WHERE voter_id_number = $1', [voterIdNumber.toUpperCase()]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Find by ID
  static async findById(id: number): Promise<Person | null> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM people WHERE id = $1', [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Update by ID
  static async findByIdAndUpdate(id: number, updateData: Partial<Person>, options: any = {}): Promise<Person | null> {
    const client = await pool.connect();
    try {
      // Filter out undefined values and id
      const fields = Object.keys(updateData).filter(key => key !== 'id' && updateData[key as keyof Person] !== undefined);
      const values = fields.map(field => updateData[field as keyof Person]);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

      if (fields.length === 0) {
        return await this.findById(id);
      }

      const result = await client.query(
        `UPDATE people SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Delete by ID
  static async findByIdAndDelete(id: number): Promise<Person | null> {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM people WHERE id = $1 RETURNING *', [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Get all people
  static async findAll(): Promise<Person[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM people WHERE is_active = true ORDER BY created_at DESC');
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Find by direction
  static async findByDirection(direction: string): Promise<Person[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM people WHERE direction = $1 AND is_active = true ORDER BY created_at DESC', [direction]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Find by created_by
  static async findByCreatedBy(createdBy: string): Promise<Person[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM people WHERE created_by = $1 AND is_active = true ORDER BY created_at DESC', [createdBy]);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

// For backward compatibility with your existing controller
export default PersonModel;
