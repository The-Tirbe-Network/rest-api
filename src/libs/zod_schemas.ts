import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Define a type for the validation source
export type ValidationSource = 'body' | 'query' | 'params';

// Middleware factory for Zod validation
export const validate = (schema: z.ZodSchema, source: ValidationSource = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Validating the ${source} of the request:`);

    try {
      // Validate the specified source of the request (e.g., body, query, params)
      const parsedData = schema.parse(req[source]);

      console.log('Parsed request data successfully\nExecuting request');

      (req as any).validatedData = parsedData; // Attach validated data to the request
      next(); // Proceed to the next middleware/controller
    } catch (err) {
      console.log('There was an error validating the request data');
      console.log(err);

      // If validation fails, send an error response
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.errors });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  };
};

export const emailSchema = z.string()
  .email('Invalid email format')
  .min(1, 'Email is required');

export type Email = z.infer<typeof emailSchema>;

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(20, 'Password must not exceed 20 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,20}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

export type Password = z.infer<typeof passwordSchema>;

// Define the login credentials schema and its type
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(1, 'Password must be at least 6 characters'),
});

// Infer the type from the schema
export type LoginCredentials = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterCredentials = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  profile_id: z.string().min(1, 'Profile ID is required'),
  username: z.string().min(1, 'Username is required'),
  bio: z.string().optional(),
  avatar: z.string().url('Invalid avatar URL').optional()
});

export type NewProfileData = z.infer<typeof profileSchema>;

