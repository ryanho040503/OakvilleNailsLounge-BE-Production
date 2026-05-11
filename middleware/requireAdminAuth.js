const config = require("../config");
const { verifyJwt } = require("../lib/jwt");

function requireAdminAuth(request, response, next) {
  if (!config.jwtSecret) {
    const error = new Error("JWT_SECRET is not configured in BackEnd/.env.");
    error.statusCode = 500;
    return next(error);
  }

  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return response.status(401).json({
      success: false,
      message: "Missing Bearer token.",
    });
  }

  try {
    const token = authHeader.slice("Bearer ".length).trim();
    const payload = verifyJwt(token, config.jwtSecret);

    if (payload.role !== "admin") {
      return response.status(403).json({
        success: false,
        message: "Admin access is required.",
      });
    }

    request.auth = payload;
    return next();
  } catch (error) {
    return response.status(401).json({
      success: false,
      message: error.message || "Invalid token.",
    });
  }
}

module.exports = {
  requireAdminAuth,
};
