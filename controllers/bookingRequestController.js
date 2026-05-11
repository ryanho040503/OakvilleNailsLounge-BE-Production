const { ZodError } = require("zod");

const { bookingSchema } = require("../lib/validators");
const { createBooking, formatBookingHeadline } = require("./bookingController");

async function createBookingRequest(request, response, next) {
  try {
    const values = bookingSchema.parse(request.body);
    const result = await createBooking(values);

    return response.status(201).json({
      success: true,
      source: "database",
      message: "Booking request received",
      bookingId: result.booking.id,
      status: result.booking.status,
      headline: formatBookingHeadline(
        result.booking.appointment_date,
        result.booking.appointment_time,
      ),
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return response.status(400).json({
        success: false,
        message: "Booking request validation failed.",
        errors: error.flatten(),
      });
    }

    return next(error);
  }
}

module.exports = {
  createBookingRequest,
};
