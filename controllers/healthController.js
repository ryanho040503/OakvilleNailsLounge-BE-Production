const config = require("../config");
const { checkSupabaseConnection } = require("../lib/supabaseClient");

async function getApiHealth(request, response) {
  const dbStatus = await checkSupabaseConnection();

  response.json({
    success: true,
    name: config.appName,
    environment: config.nodeEnv,
    supabaseConfigured: dbStatus.configured,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  getApiHealth,
};
