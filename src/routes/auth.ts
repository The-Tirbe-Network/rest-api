import {
  Email,
  emailSchema,
  LoginCredentials,
  loginSchema,
  PhoneNumber,
  phoneNumberSchema,
  RegisterViaEmailCredentials,
  registerViaEmailSchema,
  Username,
  usernameSchema,
  validate
} from "../libs/zod_schemas";
import { validateSupabaseAuth } from "../middlewares/auth.middleware";
import { Router, Request, Response } from "express";
import { supabase } from '../libs/supabase';
import { z } from "zod";
import { SignUpWithPasswordCredentials } from "@supabase/supabase-js";

const AuthRouter = Router();

/**
 * Register a user for the app via email and create the necessary tables in the database
 * 
 * TODO:
 * - Test (Completed)
 */
AuthRouter.post('/register', validate(registerViaEmailSchema), async (req: Request, res: Response) => {
  const { email, password, profile, phone } = req.validatedData as RegisterViaEmailCredentials;

  console.log('registering user for an account account');
  try {
    // 1) Create a profile first, no need to check if the username, email, or phone number is in use already
    console.log('Inserting a profile row in database');

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        ...profile,
        email
      })
      .select()
      .single();

    if (profileError) throw profileError

    // 2) Next, create an account settings row with the new profile id
    console.log('Insertomg an account settings row in database');

    const { data: accountSettingsData, error: accountSettingsError } = await supabase
      .from('account_settings')
      .insert({
        profile_id: profileData.id,
      })
      .select()
      .single();

    if (accountSettingsError) throw accountSettingsError;

    // 3) Finally, create a user and attach the profile id to the meta data
    console.log('Adding a user account to the database');

    const newAccountCredentials: SignUpWithPasswordCredentials = phone ? {
      email,
      phone,
      password,
      options: {
        data: {
          profile_id: profileData.id
        }
      }
    } : {
      email,
      password,
      options: {
        data: {
          profile_id: profileData.id
        }
      }
    };

    const { data: newUserData, error: newUserError } = await supabase.auth.signUp(newAccountCredentials);

    if (newUserError) {
      // If there was an error creating the user account, remove the new profile and account settings
      await supabase
        .from('profiles')
        .delete()
        .eq('id', profileData.id)
      throw newUserError
    };

    console.log('Account was successfully created');
    res.send({ message: 'Registration successful! Please check your email for verification.', email });
  } catch (error) {
    console.log('There was an error creating an account');
    console.log(error);
    console.log('\n')

    res.status(500).json({ error: error instanceof Error && error.message });
  }
});

/**
 * Register a user for the app via phone number (Not completed; might not be needed for MVP)
 * 
 * TODO:
 * - Test (not completed)
 */
// AuthRouter.post('/register/phone', validate(registerViaPhoneSchema), async (req: Request, res: Response) => {
//   console.log('registering account')
//   const { email, password, profile, phone } = req.validatedData as RegisterViaPhoneCredentials;

//   try {
//     // Create a profile first, no need to check if the username, email, or phone number is in use already
//     const { data: profileData, error: profileError } = await supabase
//       .from('profiles')
//       .insert(({ ...profile, email }))
//       .select()
//       .single();

//     if (profileError) throw profileError


//     // Next, create a user and depending on 
//     const { data, error } = await supabase.auth.signUp({
//       email,

//       password,
//       options: {
//         data: {
//           profile_id: ''
//         }
//       }
//     });

//     if (error) throw error;
//     res.send({ message: 'Registration successful! Please check your email for verification.', email });
//   } catch (error) {
//     console.log('There was an error creating an account');
//     res.status(500).json({ error: error instanceof Error && error.message });
//   }
// });

/**
 * Sign a user in to the app
 * 
 * TODO:
 * - Test (not completed)
 * - Add Logs
 */
AuthRouter.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.validatedData as LoginCredentials;
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

/**
 * Logout a user from the app
 * 
 * TODO:
 * - Test (not completed)
 * - Add logs
 */
AuthRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
    res.json({ message: 'Logout successful!' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error && error.message });
  }
});

/**
 * Send a reset password email
 * 
 * TODO:
 * - Test (not completed)
 * - Add logs
 */
AuthRouter.post('/forgot', async (req: Request, res: Response) => {
  const { email } = req.validatedData;
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

/**
 * Reset a password after a user has already gotten the reset email
 * 
 * TODO:
 * - Test (not completed)
 * - Add Logs
 */
AuthRouter.post('/reset', async (req: Request, res: Response) => {
  const { new_password } = req.validatedData;
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

/**
 * Check if phone number is already in use
 * 
 * TODO:
 * - Test (not completed)
 */
AuthRouter.get('/validate/phone/:phone', validate(z.object({ phone: phoneNumberSchema }), 'params'), async (req: Request, res: Response) => {
  const { phone } = req.validatedData as { phone: PhoneNumber };

  console.log(`Searching database for user with the phone number: ${phone}`);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('phone', phone);

    if (error)
      throw error;

    if (data.length !== 0) {
      console.log(`An account was found using the phone number ${phone}\n`);

      res.send({
        message: 'An account already exists with that phone number',
        isAvailable: false
      });
    } else {
      console.log(`No account was found\n`);

      res.send({
        message: 'No account exists with that phone number',
        isAvailable: true
      });
    }

  } catch (error) {
    console.log('An error occurred locating');
    console.log(`${error}\n`);

    res.status(500).json({
      error: error instanceof Error && error.message,
      message: 'There was an error',
      isAvailable: false,
    });
  }
});

/**
 * Check if an email is already in use
 * 
 * TODO:
 * - Test (not completed)
 */
AuthRouter.get('/validate/email/:email', validate(z.object({ email: emailSchema }), 'params'), async (req: Request, res: Response) => {
  const { email } = req.validatedData as { email: Email };

  console.log(`Searching database for user with the phone number: ${email}`);
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('email', email);

    if (error)
      throw error;

    if (data.length !== 0) {
      console.log(`An account was found using the email address ${email}\n`);

      res.send({
        message: 'An account already exists with that email address',
        isAvailable: false
      });
    } else {
      console.log(`No account was found\n`);

      res.send({
        message: 'No account exists with that email address',
        isAvailable: true
      });
    }

  } catch (error) {
    console.log('An error occurred locating');
    console.log(`${error}\n`);

    res.status(500).json({
      error: error instanceof Error && error.message,
      message: 'There was an error',
      isAvailable: false,
    });
  }
});

/**
 * Check if an username is already in use
 * 
 * TODO:
 * - Test (not completed)
 */
AuthRouter.get('/validate/username/:username', validate(z.object({ username: usernameSchema }), 'params'), async (req: Request, res: Response) => {
  const { username } = req.validatedData as { username: Username };

  console.log(`Searching database for user with the username: ${username}`);
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('username', username);

    if (error)
      throw error;

    if (data.length !== 0) {
      console.log(`An account was found using the username ${username}\n`);

      res.send({
        message: 'An account already exists with that username',
        isAvailable: false
      });
    } else {
      console.log(`No account was found\n`);

      res.send({
        message: 'No account exists with that username',
        isAvailable: true
      });
    }

  } catch (error) {
    console.log('An error occurred locating');
    console.log(`${error}\n`);

    res.status(500).json({
      error: error instanceof Error && error.message,
      message: 'There was an error',
      isAvailable: false,
    });
  }
});

export default AuthRouter;