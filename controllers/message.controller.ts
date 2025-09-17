import { Request, Response } from 'express';
import pool from '../config/db';

// ✅ Make sure these are properly exported functions
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    const { recipients, message, templateId } = req.body;

    console.log('📤 ========== MESSAGE SEND START ==========');
    
    // Validation
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Recipients are required and must be an array'
      });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
      return;
    }

    // ✅ FIXED: Handle string recipient IDs from Google Sheets
    const recipientIds: string[] = recipients
      .map((id: any): string => String(id).trim())
      .filter((id: string): boolean => id.length > 0);

    console.log('🎯 Valid recipient IDs:', recipientIds);

    if (recipientIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No valid recipient IDs found after processing'
      });
      return;
    }

    // Start transaction
    await client.query('BEGIN');

    // Insert message
    const insertQuery = `
      INSERT INTO messages (sender_id, direction, template_id, recipients, message, status, delivery_report, sent_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;
    
    const insertValues = [
      req.user?.id || 1,
      req.user?.direction || null,
      templateId ? parseInt(String(templateId)) : null,
      recipientIds, // Store as string array
      message.trim(),
      'sent',
      JSON.stringify(recipientIds.map(id => ({ personId: id, status: 'pending' }))),
      new Date()
    ];

    const result = await client.query(insertQuery, insertValues);
    await client.query('COMMIT');

    console.log('✅ Message saved successfully:', result.rows[0]);

    res.status(201).json({
      success: true,
      message: 'Message sent and saved successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error saving message:', error);
    
    res.status(500).json({
      success: false,
      message: 'Database error occurred',
      error: error.message
    });
  } finally {
    client.release();
  }
};

export const getSentMessages = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    let query = 'SELECT * FROM messages WHERE 1=1';
    const values: any[] = [];

    // Filter by sender for admin users
    if (req.user?.role === 'admin' && req.user?.id) {
      query += ' AND sender_id = $1';
      values.push(req.user.id);
    }

    query += ' ORDER BY created_at DESC';
    
    const result = await client.query(query, values);
    
    // Parse JSON fields
    const mappedMessages = result.rows.map(message => ({
      id: message.id,
      senderId: message.sender_id,
      direction: message.direction,
      templateId: message.template_id,
      recipients: message.recipients,
      message: message.message,
      status: message.status,
      deliveryReport: typeof message.delivery_report === 'string' 
        ? JSON.parse(message.delivery_report) 
        : message.delivery_report || [],
      sentAt: message.sent_at,
      createdAt: message.created_at,
      updatedAt: message.updated_at
    }));

    res.json({
      success: true,
      data: mappedMessages,
      count: mappedMessages.length
    });

  } catch (error: any) {
    console.error('❌ Error getting messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// ✅ Debug: Verify exports
console.log('🔍 Controller exports:', {
  sendMessage: typeof sendMessage,
  getSentMessages: typeof getSentMessages
});
