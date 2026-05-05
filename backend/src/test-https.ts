import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';

function testHttps() {
  console.log('Testing Supabase with https module...');
  const url = new URL(supabaseUrl);
  
  const start = Date.now();
  const req = https.request({
    hostname: url.hostname,
    path: '/auth/v1/health',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    console.log('Status:', res.statusCode);
    res.on('data', () => {});
    res.on('end', () => {
      console.log('Response time:', Date.now() - start, 'ms');
    });
  });

  req.on('error', (err) => {
    console.error('Error:', err.message);
  });

  req.on('timeout', () => {
    console.error('Timeout reached!');
    req.destroy();
  });

  req.end();
}

testHttps();
