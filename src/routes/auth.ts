import { LoginCredentials, loginSchema, RegisterCredentials, registerSchema, validate } from "../libs/zod_schemas";
import { validateSupabaseAuth } from "../middlewares/auth.middleware";
import { Router, Request, Response } from "express";
import { supabase } from '../libs/supabase';

const AuthRouter = Router();

AuthRouter.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  console.log('registering account')
  const { email, password } = req.body as RegisterCredentials;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          profile_id: ''
        }
      }
    });

    if (error) throw error;
    res.send({ message: 'Registration successful! Please check your email for verification.', email });
  } catch (error) {
    console.log('There was an error creating an account');
    res.status(500).json({ error: error instanceof Error && error.message });
  }
});

AuthRouter.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginCredentials;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    res.json({ message: 'Login successful!', data });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error && error.message });
  }
});

AuthRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
    res.json({ message: 'Logout successful!' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error && error.message });
  }
});

AuthRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.WEBSITE_URL}/reset-password`,
    });

    if (error) throw error;
    res.json({ message: 'Password reset instructions sent to email!' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error && error.message });
  }
});

AuthRouter.post('/reset-password', async (req: Request, res: Response) => {
  const { new_password } = req.body;
  try {
    const { error } = await supabase.auth.updateUser({
      password: new_password
    });

    if (error) throw error;
    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error && error.message });
  }
});

export default AuthRouter;