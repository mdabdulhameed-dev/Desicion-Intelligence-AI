import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

let supabaseClient = null;

export function isSupabaseConfigured() {
  return Boolean(
    config.supabaseUrl &&
    (config.supabaseServiceKey || config.supabaseAnonKey)
  );
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseClient) {
    const key = config.supabaseServiceKey || config.supabaseAnonKey;
    supabaseClient = createClient(config.supabaseUrl, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log(`[Supabase] Client initialized successfully with URL: ${config.supabaseUrl}`);
  }

  return supabaseClient;
}

// Data mapping utilities (PostgreSQL snake_case <-> Application camelCase)
function mapDecisionFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || '',
    category: row.category || 'Strategic Technology',
    tags: row.tags || [],
    status: row.status || 'evaluated',
    criteria: row.criteria || [],
    alternatives: row.alternatives || [],
    simulationConfig: row.simulation_config || null,
    decisionOutcome: row.decision_outcome || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapDecisionToDb(d) {
  return {
    id: d.id,
    user_id: d.userId,
    title: d.title,
    description: d.description || '',
    category: d.category || 'Strategic Technology',
    tags: d.tags || [],
    status: d.status || 'evaluated',
    criteria: d.criteria || [],
    alternatives: d.alternatives || [],
    simulation_config: d.simulationConfig || null,
    decision_outcome: d.decisionOutcome || null,
    created_at: d.createdAt || new Date().toISOString(),
    updated_at: d.updatedAt || new Date().toISOString()
  };
}

// Asynchronous Supabase Data Access Operations
export const supabaseStore = {
  // User operations
  async findUserByEmail(email) {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data, error } = await client
      .from('users')
      .select('*')
      .ilike('email', email)
      .maybeSingle();
    if (error) {
      console.error('[Supabase] Error finding user by email:', error.message);
      return null;
    }
    return data;
  },

  async findUserById(id) {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.error('[Supabase] Error finding user by ID:', error.message);
      return null;
    }
    return data;
  },

  async createUser(userData) {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data, error } = await client
      .from('users')
      .insert({
        id: userData.id,
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: userData.password,
        organization: userData.organization || 'Enterprise Decision Team',
        role: userData.role || 'Decision Analyst',
        created_at: userData.createdAt || new Date().toISOString()
      })
      .select()
      .single();
    if (error) {
      console.error('[Supabase] Error creating user:', error.message);
      throw error;
    }
    return data;
  },

  // Decision operations
  async findDecisionsByUser(userId) {
    const client = getSupabaseClient();
    if (!client) return [];
    const { data, error } = await client
      .from('decisions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[Supabase] Error finding decisions:', error.message);
      return [];
    }
    return (data || []).map(mapDecisionFromDb);
  },

  async findDecisionById(id, userId) {
    const client = getSupabaseClient();
    if (!client) return null;
    let query = client.from('decisions').select('*').eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error('[Supabase] Error finding decision by ID:', error.message);
      return null;
    }
    return mapDecisionFromDb(data);
  },

  async createDecision(decisionData) {
    const client = getSupabaseClient();
    if (!client) return null;
    const payload = mapDecisionToDb(decisionData);
    const { data, error } = await client
      .from('decisions')
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.error('[Supabase] Error creating decision:', error.message);
      throw error;
    }
    return mapDecisionFromDb(data);
  },

  async updateDecision(id, userId, updates) {
    const client = getSupabaseClient();
    if (!client) return null;
    
    // Fetch existing
    const existing = await this.findDecisionById(id, userId);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const payload = mapDecisionToDb(merged);
    const { data, error } = await client
      .from('decisions')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error updating decision:', error.message);
      throw error;
    }
    return mapDecisionFromDb(data);
  },

  async deleteDecision(id, userId) {
    const client = getSupabaseClient();
    if (!client) return false;
    const { error } = await client
      .from('decisions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('[Supabase] Error deleting decision:', error.message);
      return false;
    }
    return true;
  }
};
