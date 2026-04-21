import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupStorage() {
  console.log('Configurando Storage no Supabase...');

  const { data, error } = await supabaseAdmin.storage.createBucket('material_images', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
    fileSizeLimit: 5242880 // 5MB
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket "material_images" já existe.');
    } else {
      console.error('Erro ao criar bucket:', error.message);
    }
  } else {
    console.log('Bucket "material_images" criado com sucesso!');
  }
}

setupStorage();
