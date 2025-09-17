// backend/controllers/user.controller.ts - POSTGRESQL VERSION
import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.findAll();
    
    // Map to frontend format (exclude passwords)
    const mappedUsers = users.map(user => ({
      id: user.id?.toString(),
      email: user.email,
      role: user.role,
      direction: user.direction,
      createdAt: user.created_at,
      isActive: user.is_active
    }));
    
    res.json({
      success: true,
      users: mappedUsers
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Map to frontend format (exclude password)
    const mappedUser = {
      id: user.id?.toString(),
      email: user.email,
      role: user.role,
      direction: user.direction,
      createdAt: user.created_at,
      isActive: user.is_active
    };
    
    res.json({
      success: true,
      user: mappedUser
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { email, role, direction } = req.body;
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    console.log('Updating user:', userId, { email, role, direction });
    
    // Add validation
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    // Validate admin direction requirement
    if (role === 'admin' && !direction) {
      return res.status(400).json({ 
        success: false,
        message: 'Direction is required for admin users' 
      });
    }

    const updateData: any = { 
      email: email.toLowerCase(), 
      role 
    };

    // Only set direction for admin users
    if (role === 'admin') {
      updateData.direction = direction;
    } else {
      updateData.direction = null; // Clear direction for superadmin
    }

    const user = await UserModel.updateById(userId, updateData);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Map to frontend format (exclude password)
    const mappedUser = {
      id: user.id?.toString(),
      email: user.email,
      role: user.role,
      direction: user.direction,
      createdAt: user.created_at,
      isActive: user.is_active
    };
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: mappedUser
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    
    // Handle PostgreSQL constraint violations
    if (error.message?.includes('duplicate key value violates unique constraint')) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already exists' 
      });
    }

    if (error.message?.includes('violates check constraint')) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid data provided. Admin users must have a valid direction.' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    console.log('Deleting user:', userId);
    
    const success = await UserModel.deleteById(userId);
    if (!success) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};
