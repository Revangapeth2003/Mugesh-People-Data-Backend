// backend/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        direction?: string;
      };
    }
  }
}

export {};
