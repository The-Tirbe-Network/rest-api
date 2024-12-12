import { Request, Response, Router } from "express";
import { supabase } from '../libs/supabase';
import { validate } from "../libs/zod_schemas";

const ProfileRouter = Router();

export default ProfileRouter;