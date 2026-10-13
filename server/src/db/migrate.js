import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from '../config/env.js';
import { isSupabaseConfigured, getSupabaseClient } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEMA_FILE = path.resolve(__dirname, '../../../supabase/migrations/20250101000000_init_stratagem.sql');

async function runMigration() {
  console.log('===================================================================');
  console.log('       STRATAGEM AI: SUPABASE MIGRATION & VARIABLE EMITTER        ');
  console.log('===================================================================\n');

  // 1. Gather and print all required project environment variables
  console.log('🔍 [1/3] VERIFYING REQUIRED ENVIRONMENT VARIABLES:');
  const variables = [
    { Variable: 'PORT', Value: config.port, Status: 'OK', Tier: 'Backend' },
    { Variable: 'NODE_ENV', Value: config.env, Status: 'OK', Tier: 'Backend' },
    { Variable: 'JWT_SECRET', Value: config.jwtSecret.slice(0, 15) + '...', Status: 'CONFIGURED', Tier: 'Security' },
    { Variable: 'JWT_EXPIRES_IN', Value: config.jwtExpiresIn, Status: 'OK', Tier: 'Security' },
    { Variable: 'CORS_ORIGIN', Value: config.corsOrigin, Status: 'OK', Tier: 'Network' },
    { Variable: 'SUPABASE_URL', Value: config.supabaseUrl || '(Not Set)', Status: config.supabaseUrl ? 'CONFIGURED' : 'MISSING', Tier: 'Database' },
    { Variable: 'SUPABASE_ANON_KEY', Value: config.supabaseAnonKey ? (config.supabaseAnonKey.slice(0, 20) + '...') : '(Not Set)', Status: config.supabaseAnonKey ? 'CONFIGURED' : 'MISSING', Tier: 'Database' },
    { Variable: 'SUPABASE_SERVICE_ROLE_KEY', Value: config.supabaseServiceKey ? (config.supabaseServiceKey.slice(0, 20) + '...') : '(Not Set)', Status: config.supabaseServiceKey ? 'CONFIGURED' : 'MISSING', Tier: 'Database' }
  ];

  console.table(variables);

  // 2. Database Connection Check & Migration Execution
  console.log('\n🚀 [2/3] CHECKING DATABASE CONNECTIVITY & RUNNING MIGRATION:');

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    console.log('Direct PostgreSQL Connection (DATABASE_URL) detected.');
    console.log('Connecting via node-postgres (pg) to execute schema migration...');
    const client = new pg.Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log('PostgreSQL handshake successful!');
      console.log(`Reading SQL migration file: ${SCHEMA_FILE}`);
      const sql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
      
      console.log('Executing complete schema migration & seed data...');
      const result = await client.query(sql);
      
      // If final query produced rows
      const rows = Array.isArray(result) ? result[result.length - 1]?.rows : result?.rows;
      if (rows && rows.length > 0) {
        console.log('\nMigration executed successfully! Results:');
        console.table(rows);
      }
      await client.end();
    } catch (err) {
      console.error('Direct migration error:', err.message);
      await client.end().catch(() => {});
    }
  } else {
    // Check via Supabase client
    if (isSupabaseConfigured()) {
      console.log(`Supabase REST Endpoint detected at: ${config.supabaseUrl}`);
      try {
        const client = getSupabaseClient();
        console.log('Testing table readiness in Supabase schema cache...');
        const { data: users, error: userErr } = await client.from('users').select('id, email, role');
        const { data: decisions, error: decErr } = await client.from('decisions').select('id, title, category');

        if (userErr || decErr) {
          console.log('\n⚠️  NOTICE: Tables are not yet created in your Supabase project.');
          console.log('    Reason:', userErr?.message || decErr?.message);
          console.log('\n👉  ONE-CLICK SETUP:');
          console.log('    1. Open your Supabase Dashboard: https://supabase.com/dashboard');
          console.log('    2. Go to SQL Editor');
          console.log(`    3. Paste and RUN: supabase/migrations/20250101000000_init_stratagem.sql`);
          console.log('    4. The script will execute all tables, RLS, and print all variables automatically!');
        } else {
          console.log('\n🎉 Supabase Tables Verified!');
          console.log(`   • Users Table: ${users?.length || 0} active users`);
          console.log(`   • Decisions Table: ${decisions?.length || 0} active frameworks`);
        }
      } catch (err) {
        console.error('Supabase query error:', err.message);
      }
    } else {
      console.log('Supabase credentials not configured in server/.env.');
      console.log('System is running in local fallback mode (server/data/db.json).');
    }
  }

  // 3. Final Summary & Output
  console.log('\n📋 [3/3] ALL REQUIRED PLATFORM VARIABLES SUMMARY:');
  const summary = [
    { Variable: 'Frontend URL', Value: 'http://localhost:3000', Role: 'React Vite UI' },
    { Variable: 'Backend API URL', Value: `http://localhost:${config.port}/api`, Role: 'Express REST Server' },
    { Variable: 'Health Check', Value: `http://localhost:${config.port}/api/health`, Role: 'Service Health' },
    { Variable: 'Demo Login Email', Value: 'demo@stratagem.ai', Role: 'Chief Decision Architect' },
    { Variable: 'Demo Password', Value: 'StratagemDemo2025!', Role: 'Instant Evaluation' },
    { Variable: 'MCDA Algorithm', Value: 'TOPSIS + WSM + Pareto', Role: 'Decision Intelligence Core' },
    { Variable: 'Risk Engine', Value: 'Monte Carlo (1k-5k trials, VaR 95%)', Role: 'Stochastic Simulation' }
  ];
  console.table(summary);
  console.log('===================================================================\n');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
