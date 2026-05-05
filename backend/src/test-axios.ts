import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function testAxios() {
  console.log('Testing Supabase with axios...');
  const url = `${supabaseUrl}/rest/v1/profiles?select=id&limit=1`;
  
  try {
    const start = Date.now();
    const response = await axios.get(url, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    const end = Date.now();
    
    console.log('Status:', response.status);
    console.log('Response time:', end - start, 'ms');
    console.log('Data:', response.data);
  } catch (err: any) {
    console.error('Axios error:', err.message);
  }
}

testAxios();
