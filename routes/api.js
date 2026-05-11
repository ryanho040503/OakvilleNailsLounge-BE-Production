const router = require("express").Router();

const { getBookingReportSummaryRequest, listAdminBookingsRequest } = require("../controllers/adminController");
const { getAdminSessionRequest, loginAdminRequest } = require("../controllers/authController");
const { createBookingRequest } = require("../controllers/bookingRequestController");
const { getApiHealth } = require("../controllers/healthController");
const {
  getSalonInfoRequest,
  listAvailableTimeSlotsRequest,
  listFeaturedDatesRequest,
  listServicesRequest,
  listStaffRequest,
} = require("../controllers/contentController");
const { requireAdminAuth } = require("../middleware/requireAdminAuth");

router.get("/health", getApiHealth);

router.post("/auth/login", loginAdminRequest);
router.get("/auth/me", requireAdminAuth, getAdminSessionRequest);

router.get("/services", listServicesRequest);
router.get("/staff", listStaffRequest);
router.get("/salon", getSalonInfoRequest);
router.get("/featured-dates", listFeaturedDatesRequest);
router.get("/time-slots", listAvailableTimeSlotsRequest);

router.post("/bookings", createBookingRequest);
router.get("/bookings", requireAdminAuth, listAdminBookingsRequest);
router.get("/admin/reports/bookings/summary", requireAdminAuth, getBookingReportSummaryRequest);

module.exports = router;
