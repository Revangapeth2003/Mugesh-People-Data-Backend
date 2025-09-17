// backend/models/template.model.ts - POSTGRESQL VERSION
import pool from '../config/db';

export interface Template {
  id?: number;
  title: string;
  body: string;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export class TemplateModel {
  // Create template
  static async create(templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'>): Promise<Template> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO templates (title, body, created_by) VALUES ($1, $2, $3) RETURNING *',
        [templateData.title, templateData.body, templateData.created_by]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Find all templates
  static async find(filter: any = {}): Promise<Template[]> {
    const client = await pool.connect();
    try {
      let query = 'SELECT * FROM templates WHERE 1=1';
      const values: any[] = [];
      let paramCount = 1;

      // Add created_by filter if specified
      if (filter.created_by) {
        query += ` AND created_by = $${paramCount}`;
        values.push(filter.created_by);
        paramCount++;
      }

      // Add sorting
      query += ' ORDER BY created_at DESC';

      const result = await client.query(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get all templates
  static async findAll(): Promise<Template[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM templates ORDER BY created_at DESC');
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Find by ID
  static async findById(id: number): Promise<Template | null> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM templates WHERE id = $1', [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Update template
  static async updateById(id: number, updateData: Partial<Template>): Promise<Template | null> {
    const client = await pool.connect();
    try {
      const fields = Object.keys(updateData).filter(key => key !== 'id');
      const values = fields.map(field => updateData[field as keyof Template]);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

      if (fields.length === 0) {
        return await this.findById(id);
      }

      const result = await client.query(
        `UPDATE templates SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Delete template
  static async findByIdAndDelete(id: number): Promise<Template | null> {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM templates WHERE id = $1 RETURNING *', [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Delete by ID (returns boolean)
  static async deleteById(id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM templates WHERE id = $1', [id]);
      return result.rowCount! > 0;
    } finally {
      client.release();
    }
  }

  // Find by created_by
  static async findByCreatedBy(createdBy: number): Promise<Template[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM templates WHERE created_by = $1 ORDER BY created_at DESC', [createdBy]);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

// For backward compatibility
export const Template = TemplateModel;
