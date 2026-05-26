const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://usthnrlvzyrnogaolavg.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
      console.error('Supabase query error:', error);
    } else {
      console.log('Supabase query success:', data);
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

test();
