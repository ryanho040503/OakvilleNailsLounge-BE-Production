const { isSupabaseConfigured, supabaseRequest } = require("../lib/supabaseClient");

function mapService(row) {
  return {
    id: row.service_id,
    name: row.service_name,
    category: row.service_category,
    description: `${row.service_name} in the ${row.service_category} category.`,
    duration_minutes: row.standard_duration_minutes,
    price: Number(row.standard_price),
    is_active: true,
  };
}

async function getServices() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured in BackEnd/.env. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    );
  }

  const data = await supabaseRequest(
    "dim_service?select=service_key,service_id,service_name,service_category,standard_duration_minutes,standard_price&order=service_key.asc",
  );
  return data.map(mapService);
}

module.exports = {
  getServices,
};
