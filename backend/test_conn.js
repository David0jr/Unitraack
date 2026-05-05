const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Fetching profiles...');
  const start = Date.now();
  const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
  const end = Date.now();

  if (error) {
    console.error('Error connecting to Supabase:', error);
  } else {
    console.log('Connection successful!');
    console.log('Response time:', end - start, 'ms');
  }
}

test();
