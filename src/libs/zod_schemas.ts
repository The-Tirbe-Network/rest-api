import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/* Functions */

// Define a type for the validation source
export type ValidationSource = 'body' | 'query' | 'params';

// Middleware factory for Zod validation
export const validate = (schema: z.ZodSchema, source: ValidationSource = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log(`Validating the ${source} of the request:`);
    console.log(req[source]);

    try {
      // Validate the specified source of the request (e.g., body, query, params)
      const parsedData = schema.parse(req[source]);

      console.log('\tParsed request data successfully\n\tExecuting request\n');

      req.validatedData = parsedData; // Attach validated data to the request
      next(); // Proceed to the next middleware/controller
    } catch (err) {
      console.log('There was an error validating the request data\n');
      console.log(`${err}\n`);

      // If validation fails, send an error response
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.errors });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  };
};

/* Standard Object Schemas */

// Phone number
export const phoneNumberSchema = z.string()
  .length(10, 'Phone number must be exactly 10 digits')
  .regex(/^\d+$/, 'Phone number must contain only digits');

export type PhoneNumber = z.infer<typeof phoneNumberSchema>;

// Email
export const emailSchema = z.string()
  .email('Invalid email format')
  .min(1, 'Email is required');

export type Email = z.infer<typeof emailSchema>;

// Password
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(20, 'Password must not exceed 20 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,20}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

export type Password = z.infer<typeof passwordSchema>;

// Username
export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must not exceed 30 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  )
  .transform(val => val.toLowerCase()); // Optional: transform to lowercase

export type Username = z.infer<typeof usernameSchema>;

/* Merged & Extended Schemas */

// New Profile
export const newProfileSchema = z.object({
  username: usernameSchema,
  name: z.string().min(1, 'Name is required'),
  bio: z.string().optional(),
  avatar: z.string().url('Invalid avatar URL').optional()
});

export type NewProfile = z.infer<typeof newProfileSchema>;

// Login Credentials
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Default Register Credentials (w/ out modifications)
export const defaultRegisterSchema = z.object({
  password: passwordSchema,
  email: emailSchema.optional(),
  phone: phoneNumberSchema.optional(),
  profile: newProfileSchema,
});

export type DefaultRegisterCredentials = z.infer<typeof defaultRegisterSchema>;

// Register Via Email Credentials (Email )
export const registerViaEmailSchema = defaultRegisterSchema.required({ email: true });

export type RegisterViaEmailCredentials = z.infer<typeof registerViaEmailSchema>;

export const registerViaPhoneSchema = defaultRegisterSchema.required({ phone: true, email: true });

export type RegisterViaPhoneCredentials = z.infer<typeof registerViaPhoneSchema>;