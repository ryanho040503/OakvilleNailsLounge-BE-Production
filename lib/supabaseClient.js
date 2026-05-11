const { addMinutes, format } = require("date-fns");

const config = require("../config");

function isSupabaseConfigured() {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}

function getHeaders(prefer) {
  return {
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${config.supabaseAnonKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: getHeaders(options.prefer),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(
      payload && payload.message ? payload.message : `Supabase request failed for ${path}.`,
    );
    error.statusCode = response.status;
    error.details = payload || text;
    throw error;
  }

  return payload;
}

async function checkSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      configured: false,
      message: "Supabase env variables are missing.",
    };
  }

  try {
    await supabaseRequest("dim_service?select=service_key&limit=1");
    return {
      ok: true,
      configured: true,
      message: "Supabase connection check passed against dim_service.",
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      message: error instanceof Error ? error.message : "Unknown Supabase connection error.",
      details: error && error.details ? error.details : null,
    };
  }
}

async function logSupabaseConnection(context = "startup") {
  const result = await checkSupabaseConnection();

  if (!result.configured) {
    console.warn(`[supabase:${context}] ${result.message}`);
    return result;
  }

  if (result.ok) {
    console.log(`[supabase:${context}] ${result.message}`);
  } else {
    console.error(`[supabase:${context}] ${result.message}`);
    if (result.details) {
      console.error(`[supabase:${context}] details: ${JSON.stringify(result.details)}`);
    }
  }

  return result;
}

async function getNextNumericKey(table, keyColumn) {
  const data = await supabaseRequest(`${table}?select=${keyColumn}&order=${keyColumn}.desc&limit=1`);
  return data && data.length > 0 ? Number(data[0][keyColumn]) + 1 : 1;
}

function getDateKey(date) {
  return Number(date.replaceAll("-", ""));
}

function to24HourTime(label) {
  const [timePart, meridiem] = label.split(" ");
  const [hourString, minuteString] = timePart.split(":");
  let hours = Number(hourString);
  const minutes = Number(minuteString);

  if (meridiem === "PM" && hours !== 12) {
    hours += 12;
  }

  if (meridiem === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

async function ensureDateDimension(date) {
  const dateKey = getDateKey(date);
  const existing = await supabaseRequest(`dim_date?select=date_key&date_key=eq.${dateKey}&limit=1`);

  if (existing.length > 0) {
    return existing[0].date_key;
  }

  const dateValue = new Date(`${date}T00:00:00`);
  await supabaseRequest("dim_date", {
    method: "POST",
    body: {
      date_key: dateKey,
      full_date: date,
      day: dateValue.getDate(),
      month: dateValue.getMonth() + 1,
      year: dateValue.getFullYear(),
      day_of_week: format(dateValue, "EEEE"),
    },
  });

  return dateKey;
}

async function ensureTimeSlotDimension(timeLabel) {
  const startTime = to24HourTime(timeLabel);
  const existing = await supabaseRequest(
    `dim_time_slot?select=time_slot_key&start_time=eq.${encodeURIComponent(startTime)}&limit=1`,
  );

  if (existing.length > 0) {
    return existing[0].time_slot_key;
  }

  const timeSlotKey = await getNextNumericKey("dim_time_slot", "time_slot_key");
  const endTime = format(addMinutes(new Date(`2000-01-01T${startTime}`), 30), "HH:mm:ss");
  const hour = Number(startTime.slice(0, 2));
  const dayPart = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  await supabaseRequest("dim_time_slot", {
    method: "POST",
    body: {
      time_slot_key: timeSlotKey,
      start_time: startTime,
      end_time: endTime,
      day_part: dayPart,
    },
  });

  return timeSlotKey;
}

async function ensureBookingStatus(statusName) {
  const existing = await supabaseRequest(
    `dim_booking_status?select=status_key&status_name=eq.${encodeURIComponent(statusName)}&limit=1`,
  );

  if (existing.length > 0) {
    return existing[0].status_key;
  }

  const statusKey = await getNextNumericKey("dim_booking_status", "status_key");
  await supabaseRequest("dim_booking_status", {
    method: "POST",
    body: {
      status_key: statusKey,
      status_name: statusName,
    },
  });

  return statusKey;
}

async function ensureCustomerDimension(values) {
  const existing = await supabaseRequest(
    `dim_customer?select=customer_key,customer_id,first_name,last_name,phone,email&email=eq.${encodeURIComponent(values.email)}&phone=eq.${encodeURIComponent(values.phone)}&limit=1`,
  );

  if (existing.length > 0) {
    return existing[0];
  }

  const customerKey = await getNextNumericKey("dim_customer", "customer_key");
  const customer = {
    customer_key: customerKey,
    customer_id: `cust-${customerKey}`,
    first_name: values.firstName,
    last_name: values.lastName,
    phone: values.phone,
    email: values.email,
  };

  await supabaseRequest("dim_customer", {
    method: "POST",
    body: customer,
  });

  return customer;
}

async function getServiceDimensions(serviceIds) {
  const idsFilter = serviceIds.map((serviceId) => `"${serviceId}"`).join(",");
  const data = await supabaseRequest(
    `dim_service?select=service_key,service_id,service_name,service_category,standard_duration_minutes,standard_price&service_id=in.(${encodeURIComponent(idsFilter)})`,
  );

  if (!data || data.length !== serviceIds.length) {
    const error = new Error("One or more selected services are not available in dim_service.");
    error.statusCode = 400;
    throw error;
  }

  return data;
}

async function resolveStaffDimension(staffId) {
  if (staffId) {
    const specific = await supabaseRequest(
      `dim_staff?select=staff_key,staff_id,staff_name,role,is_active,email&staff_id=eq.${encodeURIComponent(staffId)}&is_active=eq.true&limit=1`,
    );

    if (specific.length > 0) {
      return specific[0];
    }
  }

  const fallback = await supabaseRequest(
    "dim_staff?select=staff_key,staff_id,staff_name,role,is_active,email&is_active=eq.true&order=staff_key.asc&limit=1",
  );

  if (!fallback || fallback.length === 0) {
    const error = new Error("No active staff is available in dim_staff.");
    error.statusCode = 400;
    throw error;
  }

  return fallback[0];
}

module.exports = {
  checkSupabaseConnection,
  ensureBookingStatus,
  ensureCustomerDimension,
  ensureDateDimension,
  ensureTimeSlotDimension,
  getNextNumericKey,
  getServiceDimensions,
  isSupabaseConfigured,
  logSupabaseConnection,
  resolveStaffDimension,
  supabaseRequest,
  to24HourTime,
};
