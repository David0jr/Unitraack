import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function testFetch() {
  console.log('Testing Supabase with fetch...');
  const url = `${supabaseUrl}/rest/v1/profiles?select=id&limit=1`;
  
  try {
    const start = Date.now();
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    const end = Date.now();
    
    console.log('Status:', response.status);
    console.log('Response time:', end - start, 'ms');
    const text = await response.text();
    console.log('Body:', text.substring(0, 100));
  } catch (err: any) {
    console.error('Fetch error:', err.message);
  }
}

testFetch();
