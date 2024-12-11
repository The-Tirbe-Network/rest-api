import { Request, Response, Router } from "express";
import { supabase } from '../libs/supabase';
import { NewProfileData, profileSchema, validate } from "../libs/zod_schemas";

const ProfileRouter = Router();

ProfileRouter.post('/profile/new', validate(profileSchema), async (req: Request, res: Response) => {
  const { name, profile_id, username, bio, avatar } = req.body as NewProfileData;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert(({ name, username, bio, avatar }))
      .eq('profile_id', profile_id) // a profile will automatically be created on new user sign up, so just find it in the db
      .neq('username', username); // Check if there is a profile that exist with that username already

    if (error) throw error;
    res.json({ message: 'Registration successful! Please check your email for verification.', data });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error && error.message });
  }
})

export default ProfileRouter;