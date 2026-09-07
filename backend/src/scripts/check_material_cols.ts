import { supabaseAdmin } from '../config/supabase';

async function checkCols() {
    const { data, error } = await supabaseAdmin
        .from('materials')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error(error);
        return;
    }
    
    if (data && data.length > 0) {
        console.log(Object.keys(data[0]));
    }
}

checkCols();
