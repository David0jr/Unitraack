import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  const { data, error } = await supabaseAdmin.storage.createBucket('material-images', {
    public: true, // Make it a public bucket!
    allowedMimeTypes: ['image/*'],
    fileSizeLimit: 5242880 // 5MB
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket "material-images" already exists.');
    } else {
      console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Bucket "material-images" created successfully:', data);
  }
}

createBucket();
