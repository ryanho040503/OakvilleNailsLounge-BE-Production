const config = require("../config");
const { ZodError } = require("zod");

const { signJwt } = require("../lib/jwt");
const { adminLoginSchema } = require("../lib/validators");

function assertAdminAuthConfig() {
  if (!config.jwtSecret || !config.adminUsername || !config.adminPassword) {
    const error = new Error(
      "Admin auth is not configured. Set JWT_SECRET, ADMIN_USERNAME, and ADMIN_PASSWORD in BackEnd/.env.",
    );
    error.statusCode = 500;
    throw error;
  }
}

async function loginAdminRequest(request, response, next) {
  try {
    assertAdminAuthConfig();

    const credentials = adminLoginSchema.parse(request.body);
    const usernameMatches = credentials.username === config.adminUsername;
    const passwordMatches = credentials.password === config.adminPassword;

    if (!usernameMatches || !passwordMatches) {
      return response.status(401).json({
        success: false,
        message: "Invalid admin username or password.",
      });
    }

    const token = signJwt(
      {
        sub: config.adminUsername,
        role: "admin",
      },
      config.jwtSecret,
      config.jwtExpiresInSeconds,
    );

    return response.json({
      success: true,
      message: "Admin login successful.",
      data: {
        token,
        tokenType: "Bearer",
        expiresInSeconds: config.jwtExpiresInSeconds,
        admin: {
          username: config.adminUsername,
          role: "admin",
        },
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return response.status(400).json({
        success: false,
        message: "Admin login validation failed.",
        errors: error.flatten(),
      });
    }

    return next(error);
  }
}

function getAdminSessionRequest(request, response) {
  response.json({
    success: true,
    data: {
      username: request.auth.sub,
      role: request.auth.role,
      expiresAt: request.auth.exp,
    },
  });
}

module.exports = {
  getAdminSessionRequest,
  loginAdminRequest,
};
