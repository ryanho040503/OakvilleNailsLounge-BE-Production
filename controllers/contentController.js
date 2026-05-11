const { getServices } = require("./serviceController");
const { getStaff } = require("./staffController");
const { getAvailableTimeSlots } = require("./bookingController");
const { featuredDates, salonInfo } = require("../data/mockData");

async function listServicesRequest(_request, response, next) {
  try {
    response.json({
      success: true,
      source: "database",
      data: await getServices(),
    });
  } catch (error) {
    next(error);
  }
}

async function listStaffRequest(_request, response, next) {
  try {
    response.json({
      success: true,
      source: "database",
      data: await getStaff(),
    });
  } catch (error) {
    next(error);
  }
}

function getSalonInfoRequest(_request, response) {
  response.json({
    success: true,
    data: salonInfo,
  });
}

function listFeaturedDatesRequest(_request, response) {
  response.json({
    success: true,
    data: featuredDates,
  });
}

async function listAvailableTimeSlotsRequest(request, response, next) {
  const { date } = request.query;
  const staffId = typeof request.query.staffId === "string" ? request.query.staffId : undefined;

  if (typeof date !== "string" || Number.isNaN(new Date(date).getTime())) {
    return response.status(400).json({
      success: false,
      message: "Provide a valid date query like /api/time-slots?date=2026-04-24",
    });
  }

  try {
    return response.json({
      success: true,
      source: "database",
      data: await getAvailableTimeSlots(date, staffId),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getSalonInfoRequest,
  listAvailableTimeSlotsRequest,
  listFeaturedDatesRequest,
  listServicesRequest,
  listStaffRequest,
};
