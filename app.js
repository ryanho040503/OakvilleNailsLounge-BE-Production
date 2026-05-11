const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const config = require("./config");
const apiRouter = require("./routes/api");

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (config.corsOrigin.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS origin denied: ${origin}`));
    },
  }),
);
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_request, response) => {
  response.json({
    success: true,
    message: "Oakville Nails Lounge API is running.",
    docs: {
      health: `${config.apiBasePath}/health`,
      services: `${config.apiBasePath}/services`,
      staff: `${config.apiBasePath}/staff`,
      timeSlots: `${config.apiBasePath}/time-slots?date=YYYY-MM-DD`,
      bookings: `${config.apiBasePath}/bookings`,
    },
  });
});

app.use(config.apiBasePath, apiRouter);

app.use((request, response) => {
  response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
});

app.use((error, _request, response, _next) => {
  const statusCode = error.statusCode || 500;

  response.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Something went wrong while processing the request."
        : error.message,
    ...(config.nodeEnv !== "production" && error.stack ? { stack: error.stack } : {}),
  });
});

module.exports = app;
