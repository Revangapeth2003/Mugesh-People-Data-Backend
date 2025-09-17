import pool from '../config/db';

export interface DeliveryReport {
  personId: string;
  status: string;
}

export interface Message {
  id?: number;
  sender_id: number;
  direction?: string;
  template_id?: number;
  recipients: number[];
  message: string;
  status: string;
  delivery_report: DeliveryReport[];
  sent_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class MessageModel {
  // Create message
  static async create(messageData: Omit<Message, 'id' | 'created_at' | 'updated_at'>): Promise<Message> {
    const client = await pool.connect();
    try {
      console.log('🔧 Executing INSERT query with data:', messageData);
      
      const result = await client.query(
        `INSERT INTO messages (sender_id, direction, template_id, recipients, message, status, delivery_report, sent_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [
          messageData.sender_id,
          messageData.direction,
          messageData.template_id,
          messageData.recipients,
          messageData.message,
          messageData.status,
          JSON.stringify(messageData.delivery_report),
          messageData.sent_at
        ]
      );
      
      console.log('✅ INSERT successful, rows affected:', result.rowCount);
      console.log('✅ Returned data:', result.rows[0]);
      
      if (result.rows.length === 0) {
        throw new Error('Insert query executed but no data was returned');
      }
      
      const message = result.rows[0];
      if (message.delivery_report) {
        message.delivery_report = JSON.parse(message.delivery_report);
      }
      
      return message;
    } catch (error) {
      console.error('❌ Database INSERT error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Find messages with filter
  static async find(filter: any = {}): Promise<Message[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM messages WHERE 1=1';
      const values: any[] = [];
      let paramCount = 1;

      if (filter.sender_id) {
        query += ` AND sender_id = $${paramCount}`;
        values.push(filter.sender_id);
        paramCount++;
      }

      query += ' ORDER BY created_at DESC';

      const result = await client.query(query, values);
      
      return result.rows.map(message => ({
        ...message,
        delivery_report: typeof message.delivery_report === 'string' 
          ? JSON.parse(message.delivery_report) 
          : message.delivery_report || []
      }));
    } finally {
      client.release();
    }
  }

  // Find by ID
  static async findById(id: number): Promise<Message | null> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM messages WHERE id = $1', [id]);
      if (result.rows.length === 0) return null;
      
      const message = result.rows[0];
      message.delivery_report = JSON.parse(message.delivery_report || '[]');
      return message;
    } finally {
      client.release();
    }
  }
}

export const Message = MessageModel;
