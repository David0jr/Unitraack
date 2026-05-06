import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
    console.log("Checking columns in entry_requests...");
    const { error: reqErr } = await supabase
        .from('entry_requests')
        .update({ check_in_by: null })
        .eq('id', '00000000-0000-0000-0000-000000000000'); // Fake ID to test column existence

    if (reqErr && reqErr.message.includes("column")) {
        console.log("entry_requests: check_in_by is MISSING");
    } else {
        console.log("entry_requests: check_in_by is PRESENT (or other error)");
    }

    console.log("Checking columns in materials...");
    const { error: matErr } = await supabase
        .from('materials')
        .update({ check_in_by: null, check_out_by: null })
        .eq('id', '00000000-0000-0000-0000-000000000000');

    if (matErr) {
        console.log("materials error:", matErr.message);
    } else {
        console.log("materials: audit columns are PRESENT");
    }
}

test();
