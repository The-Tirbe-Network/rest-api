import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Database } from '../../@types/supabase';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLIC_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey); 