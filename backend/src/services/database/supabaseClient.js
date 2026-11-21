const { createClient } = require('@supabase/supabase-js');
const config = require('../../config/config');
const { SupabaseNotConfiguredError } = require('./databaseErrors');

let client;

function getSupabaseClient() {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new SupabaseNotConfiguredError();
  }

  if (!client) {
    let url;

    try {
      url = new URL(config.supabaseUrl);
    } catch {
      throw new SupabaseNotConfiguredError();
    }

    if (!['http:', 'https:'].includes(url.protocol)
      || url.username
      || url.password
      || url.search
      || url.hash) {
      throw new SupabaseNotConfiguredError();
    }

    try {
      client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
    } catch {
      throw new SupabaseNotConfiguredError();
    }
  }

  return client;
}

module.exports = { getSupabaseClient };
