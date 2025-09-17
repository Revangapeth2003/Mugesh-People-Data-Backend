import { Request, Response, NextFunction } from 'express';

export const requireRole = (role: 'superadmin' | 'admin') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Access Denied' });
    }
    next();
  };
};
