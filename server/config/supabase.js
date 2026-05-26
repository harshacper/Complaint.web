const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://usthnrlvzyrnogaolavg.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SECRET_KEY in environment variables!');
}

const supabase = createClient(supabaseUrl, supabaseKey || '');

console.log('✅ Connected to Supabase successfully!');

module.exports = supabase;
