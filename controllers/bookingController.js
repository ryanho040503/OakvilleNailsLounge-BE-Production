const { format } = require("date-fns");

const {
  ensureBookingStatus,
  ensureCustomerDimension,
  ensureDateDimension,
  ensureTimeSlotDimension,
  getNextNumericKey,
  getServiceDimensions,
  isSupabaseConfigured,
  resolveStaffDimension,
  supabaseRequest,
  to24HourTime,
} = require("../lib/supabaseClient");

function formatTimeLabel(timeValue) {
  const [hourPart, minutePart] = String(timeValue).slice(0, 5).split(":");
  const hours = Number(hourPart);
  const meridiem = hours >= 12 ? "PM" : "AM";
  const normalizedHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${normalizedHour}:${minutePart} ${meridiem}`;
}

function getDateKey(date) {
  return Number(date.replaceAll("-", ""));
}

function addMinutes(dateValue, minutes) {
  return new Date(dateValue.getTime() + minutes * 60 * 1000);
}

function getTimeSlotWindow(date, timeValue) {
  const startAt = new Date(`${date}T${String(timeValue).slice(0, 8)}`);
  const endAt = addMinutes(startAt, 30);

  return {
    startAt,
    endAt,
  };
}

function getBookingWindow(row) {
  const startAt = new Date(row.appointment_start_at);

  if (Number.isNaN(startAt.getTime())) {
    return null;
  }

  const endAtFromRow = row.appointment_end_at ? new Date(row.appointment_end_at) : null;
  const hasUsableEndAt =
    endAtFromRow instanceof Date &&
    !Number.isNaN(endAtFromRow.getTime()) &&
    endAtFromRow.getTime() > startAt.getTime();

  return {
    staffKey: row.staff_key,
    startAt,
    endAt: hasUsableEndAt ? endAtFromRow : addMinutes(startAt, Number(row.duration_minutes) || 0),
  };
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

async function getActiveStaffDimensions() {
  return supabaseRequest(
    "dim_staff?select=staff_key,staff_id,staff_name,role,is_active,email&is_active=eq.true&order=staff_key.asc",
  );
}

async function getBookingsForDate(appointmentDateKey) {
  return supabaseRequest(
    `fact_booking?select=staff_key,appointment_start_at,appointment_end_at,duration_minutes&appointment_date_key=eq.${appointmentDateKey}`,
  );
}

function getBusyStaffKeysForWindow(bookings, windowStartAt, windowEndAt) {
  const bookedStaffKeys = new Set();

  for (const row of bookings) {
    const bookingWindow = getBookingWindow(row);

    if (!bookingWindow) {
      continue;
    }

    if (
      rangesOverlap(
        bookingWindow.startAt,
        bookingWindow.endAt,
        windowStartAt,
        windowEndAt,
      )
    ) {
      bookedStaffKeys.add(bookingWindow.staffKey);
    }
  }

  return bookedStaffKeys;
}

function getOccupiedStaffKeysForAppointment(bookings, appointmentStartAt, appointmentEndAt) {
  return getBusyStaffKeysForWindow(bookings, appointmentStartAt, appointmentEndAt);
}

async function resolveAvailableStaffDimension(staffId, appointmentDateKey, appointmentStartAt, appointmentEndAt) {
  const activeStaff = await getActiveStaffDimensions();

  if (!activeStaff || activeStaff.length === 0) {
    const error = new Error("No active staff is available in dim_staff.");
    error.statusCode = 400;
    throw error;
  }

  const bookings = await getBookingsForDate(appointmentDateKey);
  const occupiedStaffKeys = getOccupiedStaffKeysForAppointment(
    bookings,
    appointmentStartAt,
    appointmentEndAt,
  );

  if (staffId) {
    const preferredStaff = activeStaff.find((staffMember) => staffMember.staff_id === staffId);

    if (!preferredStaff) {
      const error = new Error("The selected staff member is not available.");
      error.statusCode = 400;
      throw error;
    }

    if (occupiedStaffKeys.has(preferredStaff.staff_key)) {
      const error = new Error("That time slot is no longer available for the selected staff member.");
      error.statusCode = 409;
      throw error;
    }

    return preferredStaff;
  }

  const availableStaff = activeStaff.find((staffMember) => !occupiedStaffKeys.has(staffMember.staff_key));

  if (!availableStaff) {
    const error = new Error("That time slot is no longer available. Please choose another time.");
    error.statusCode = 409;
    throw error;
  }

  return availableStaff;
}

async function getAvailableTimeSlots(date, staffId) {

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured in BackEnd/.env. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    );
  }

  const rows = await supabaseRequest(
    "dim_time_slot?select=time_slot_key,start_time&order=start_time.asc",
  );

  if (!rows || rows.length === 0) {
    throw new Error("No time slots are available in dim_time_slot.");
  }

  const appointmentDateKey = getDateKey(date);
  const bookings = await getBookingsForDate(appointmentDateKey);
  const activeStaff = await getActiveStaffDimensions();
  let selectedStaffKey = null;

  if (staffId) {
    const selectedStaff = await resolveStaffDimension(staffId);
    selectedStaffKey = selectedStaff.staff_key;
  }

  const availability = await Promise.all(
    rows.map(async (row) => {
      const slotWindow = getTimeSlotWindow(date, row.start_time);
      const busyStaffKeys = getBusyStaffKeysForWindow(
        bookings,
        slotWindow.startAt,
        slotWindow.endAt,
      );

      return {
        time: formatTimeLabel(row.start_time),
        booked: selectedStaffKey
          ? busyStaffKeys.has(selectedStaffKey)
          : busyStaffKeys.size >= activeStaff.length,
      };
    }),
  );

  return availability;
}

async function createBooking(values) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured in BackEnd/.env. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    );
  }

  const [serviceDimensions, customerDimension, bookingDateKey, appointmentDateKey, timeSlotKey, statusKey] =
    await Promise.all([
      getServiceDimensions(values.serviceIds),
      ensureCustomerDimension(values),
      ensureDateDimension(format(new Date(), "yyyy-MM-dd")),
      ensureDateDimension(values.appointmentDate),
      ensureTimeSlotDimension(values.appointmentTime),
      ensureBookingStatus("Pending"),
    ]);
  const requestedStartAt = new Date(
    `${values.appointmentDate}T${to24HourTime(values.appointmentTime)}`,
  );
  const totalDurationMinutes = serviceDimensions.reduce(
    (sum, serviceDimension) => sum + Number(serviceDimension.standard_duration_minutes),
    0,
  );
  const requestedEndAt = addMinutes(requestedStartAt, totalDurationMinutes);
  const staffDimension = await resolveAvailableStaffDimension(
    values.staffId,
    appointmentDateKey,
    requestedStartAt,
    requestedEndAt,
  );

  const bookingCreatedAt = new Date().toISOString();
  const baseBookingId = await getNextNumericKey("fact_booking", "booking_id");
  let serviceStartAt = requestedStartAt;

  await supabaseRequest("fact_booking", {
    method: "POST",
    body: serviceDimensions.map((serviceDimension, index) => {
      const durationMinutes = Number(serviceDimension.standard_duration_minutes);
      const serviceEndAt = addMinutes(serviceStartAt, durationMinutes);
      const factRow = {
        booking_id: baseBookingId + index,
        customer_key: customerDimension.customer_key,
        staff_key: staffDimension.staff_key,
        service_key: serviceDimension.service_key,
        booking_date_key: bookingDateKey,
        appointment_date_key: appointmentDateKey,
        time_slot_key: timeSlotKey,
        status_key: statusKey,
        booking_created_at: bookingCreatedAt,
        appointment_start_at: serviceStartAt.toISOString(),
        appointment_end_at: serviceEndAt.toISOString(),
        duration_minutes: durationMinutes,
        service_price: Number(serviceDimension.standard_price),
        discount_amount: 0,
        tip_amount: 0,
        tax_amount: 0,
        total_amount: Number(serviceDimension.standard_price),
        is_walk_in: false,
      };

      serviceStartAt = serviceEndAt;
      return factRow;
    }),
  });

  const customer = {
    id: customerDimension.customer_id,
    first_name: customerDimension.first_name,
    last_name: customerDimension.last_name,
    phone: customerDimension.phone,
    email: customerDimension.email,
    created_at: bookingCreatedAt,
  };

  const booking = {
    id: String(baseBookingId),
    customer_id: customerDimension.customer_id,
    service_ids: values.serviceIds,
    staff_id: staffDimension.staff_id,
    staff_email: staffDimension.email || null,
    appointment_date: values.appointmentDate,
    appointment_time: values.appointmentTime,
    status: "Pending",
    notes: values.notes || null,
    created_at: bookingCreatedAt,
  };

  return { customer, booking };
}

function formatBookingHeadline(date, time) {
  return `${format(new Date(date), "EEEE, MMMM d")} at ${time}`;
}

async function listBookings() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured in BackEnd/.env. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    );
  }

  const rows = await supabaseRequest(
    "fact_booking?select=booking_id,customer_key,staff_key,service_key,appointment_start_at,booking_created_at&order=booking_created_at.desc",
  );

  return rows;
}

async function getBookingReportSummary() {
  const rows = await listBookings();

  const uniqueCustomers = new Set();
  const uniqueStaff = new Set();
  const uniqueServices = new Set();
  let latestBookingCreatedAt = null;

  for (const row of rows) {
    if (row.customer_key) {
      uniqueCustomers.add(row.customer_key);
    }

    if (row.staff_key) {
      uniqueStaff.add(row.staff_key);
    }

    if (row.service_key) {
      uniqueServices.add(row.service_key);
    }

    if (!latestBookingCreatedAt || row.booking_created_at > latestBookingCreatedAt) {
      latestBookingCreatedAt = row.booking_created_at;
    }
  }

  return {
    totalBookingRows: rows.length,
    uniqueCustomerCount: uniqueCustomers.size,
    assignedStaffCount: uniqueStaff.size,
    bookedServiceCount: uniqueServices.size,
    latestBookingCreatedAt,
  };
}

module.exports = {
  createBooking,
  formatBookingHeadline,
  getBookingReportSummary,
  getAvailableTimeSlots,
  listBookings,
};
