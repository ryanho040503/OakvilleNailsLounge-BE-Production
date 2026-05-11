const { listBookings, getBookingReportSummary } = require("./bookingController");

async function listAdminBookingsRequest(_request, response, next) {
  try {
    response.json({
      success: true,
      source: "database",
      data: await listBookings(),
    });
  } catch (error) {
    next(error);
  }
}

async function getBookingReportSummaryRequest(_request, response, next) {
  try {
    response.json({
      success: true,
      source: "database",
      data: await getBookingReportSummary(),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getBookingReportSummaryRequest,
  listAdminBookingsRequest,
};
