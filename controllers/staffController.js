const { isSupabaseConfigured, supabaseRequest } = require("../lib/supabaseClient");

function mapStaff(row) {
  return {
    id: row.staff_id,
    name: row.staff_name,
    role: row.role || "Nail Technician",
    bio: row.email ? `Reach ${row.staff_name} at ${row.email}.` : `${row.staff_name} is available for booking appointments.`,
    image_url: "",
    is_active: row.is_active !== false,
  };
}

async function getStaff() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured in BackEnd/.env. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    );
  }

  const data = await supabaseRequest(
    "dim_staff?select=staff_key,staff_id,staff_name,role,is_active,email&is_active=eq.true&order=staff_key.asc",
  );
  return data.map(mapStaff);
}

module.exports = {
  getStaff,
};
