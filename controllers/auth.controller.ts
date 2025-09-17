// backend/controllers/auth.controller.ts - ENHANCED WITH DEBUG LOGGING
import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Register Controller
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role, direction } = req.body;
    console.log('📝 Registration attempt:', { email, role, direction });

    // Validation
    if (!email || !password || !role) {
      return res.status(400).json({ 
        success: false,
        message: 'Email, password, and role are required' 
      });
    }

    // Validate admin direction requirement
    if (role === 'admin' && !direction) {
      return res.status(400).json({ 
        success: false,
        message: 'Direction is required for admin users' 
      });
    }

    // Validate direction values
    if (role === 'admin' && !['East', 'West', 'North', 'South'].includes(direction)) {
      return res.status(400).json({ 
        success: false,
        message: 'Direction must be East, West, North, or South' 
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email.toLowerCase());
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // Create new user
    const userData = {
      email: email.toLowerCase(),
      password,
      role,
      direction: role === 'admin' ? direction : undefined,
      is_active: true
    };

    const newUser = await UserModel.create(userData);
    console.log('✅ User registered successfully:', email);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email,
        role: newUser.role, 
        direction: newUser.direction 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return success response (exclude password)
    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      token, 
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        direction: newUser.direction,
        createdAt: newUser.created_at
      }
    });

  } catch (error: any) {
    console.error('❌ Registration error:', error);
    
    // Handle PostgreSQL validation errors
    if (error.message?.includes('duplicate key value violates unique constraint')) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already exists' 
      });
    }
    
    if (error.message?.includes('violates check constraint')) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid data provided. Please check all required fields.' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error during registration' 
    });
  }
};

// Login Controller
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt for:', email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Find user in database
    const user = await UserModel.findByEmail(email.toLowerCase());
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ User account is deactivated:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Account is deactivated. Contact administrator.' 
      });
    }

    // Compare password
    const isPasswordValid = await UserModel.comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role, 
        direction: user.direction 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', email, user.role);

    // Return success response
    res.json({ 
      success: true,
      message: 'Login successful',
      token, 
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        direction: user.direction,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
};

// Verify token and get user info
export const verifyUser = async (req: Request, res: Response) => {
  try {
    // req.user is set by the authenticate middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'No user information found' 
      });
    }

    // Get fresh user data from database
    const user = await UserModel.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ 
        success: false,
        message: 'Account is deactivated' 
      });
    }

    res.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        direction: user.direction,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('❌ Verify user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get all users (for admin panel)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.findAll();
    
    // Filter active users and exclude passwords
    const activeUsers = users
      .filter(user => user.is_active)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        direction: user.direction,
        createdAt: user.created_at,
        isActive: user.is_active
      }));
    
    res.json({
      success: true,
      count: activeUsers.length,
      users: activeUsers
    });

  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// ✅ ENHANCED Change Password Function with Debug Logging
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    console.log('🔍 Password change debug info:', {
      userId,
      userEmail: req.user.email,
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword,
      newPasswordLength: newPassword?.length
    });

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find user
    const user = await UserModel.findById(userId);
    if (!user) {
      console.log('❌ User not found for ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('🔍 Found user:', user.email);

    // Verify current password
    const isCurrentPasswordValid = await UserModel.comparePassword(currentPassword, user.password);
    console.log('🔍 Current password validation:', isCurrentPasswordValid);
    
    if (!isCurrentPasswordValid) {
      console.log('❌ Current password incorrect for user:', user.email);
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current password
    const isSamePassword = await UserModel.comparePassword(newPassword, user.password);
    console.log('🔍 Is same password check:', isSamePassword);
    
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Log before database update
    console.log('🔄 About to update password in database...');
    
    // Update password in database
    const updatedUser = await UserModel.updateById(userId, { password: newPassword });
    
    // Log after database update
    console.log('✅ Database update result:', !!updatedUser);

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update password in database'
      });
    }

    console.log('✅ Password updated successfully for user:', user.email);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
