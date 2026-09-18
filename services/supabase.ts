
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uorfbmdliwmzclmliugj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TD5Aq5tHC3C6-uaIAbBs9Q_0pd5PSvv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
