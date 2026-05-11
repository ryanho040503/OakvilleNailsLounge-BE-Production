const { isBefore, startOfDay } = require("date-fns");
const { z } = require("zod");

function parseDateInput(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText] = match;
  const parsedDate = new Date(Number(yearText), Number(monthText) - 1, Number(dayText));

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function isValidTimeSlot(value) {
  const match = value.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);

  if (!match) {
    return false;
  }

  const [, hourText, minuteText, meridiem] = match;
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (hour < 1 || hour > 12 || ![0, 30].includes(minute)) {
    return false;
  }

  let normalizedHour = hour % 12;
  if (meridiem === "PM") {
    normalizedHour += 12;
  }

  const totalMinutes = normalizedHour * 60 + minute;
  return totalMinutes >= 9 * 60 && totalMinutes <= 20 * 60;
}

const bookingSchema = z.object({
  serviceIds: z.array(z.string()).min(1, "Please select at least one service."),
  staffId: z.string().optional(),
  appointmentDate: z
    .string()
    .min(1, "Please choose a date.")
    .refine((value) => parseDateInput(value) !== null, {
      message: "Please choose a valid date.",
    })
    .refine((value) => {
      const parsedDate = parseDateInput(value);

      return parsedDate !== null && !isBefore(parsedDate, startOfDay(new Date()));
    }, {
      message: "Please choose today or a future date.",
    }),
  appointmentTime: z
    .string()
    .min(1, "Please choose a time slot.")
    .refine(isValidTimeSlot, "Select a valid time slot."),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  phone: z.string().trim().min(1, "Phone number is required."),
  email: z.string().email("Enter a valid email address."),
  notes: z.string().max(500, "Keep notes under 500 characters.").optional().or(z.literal("")),
});

const adminLoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

module.exports = {
  adminLoginSchema,
  bookingSchema,
};
