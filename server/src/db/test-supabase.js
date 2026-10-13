import { isSupabaseConfigured, getSupabaseClient } from './supabase.js';

async function verifySupabaseConnection() {
  console.log('--- Stratagem AI: Supabase Connection Verification ---');
  if (!isSupabaseConfigured()) {
    console.log('Status: NOT CONFIGURED');
    console.log('Notice: SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are not present in server/.env.');
    console.log('Fallback: System is currently running seamlessly in Local Atomic Store mode (db.json).');
    console.log('To activate: Copy your keys from your Supabase Dashboard into server/.env.');
    return;
  }

  try {
    const client = getSupabaseClient();
    console.log('Attempting handshake with Supabase project...');
    const { data, error } = await client.from('users').select('count', { count: 'exact', head: true });

    if (error) {
      console.error('Connection Error:', error.message);
      console.log('Tip: Ensure you have executed the schema migration script: supabase/schema.sql in your Supabase SQL Editor.');
    } else {
      console.log('Connection Successful!');
      console.log(`Connected to Supabase PostgreSQL. Users table verified.`);
    }
  } catch (err) {
    console.error('Handshake failed:', err.message);
  }
}

verifySupabaseConnection();
