import { Request, Response, NextFunction } from 'express';
import { supabase } from '../libs/supabase';

export const validateSupabaseAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    // Attach the user to the request object
    (req as any).user = {
      id: user.id,
      email: user.email!
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 