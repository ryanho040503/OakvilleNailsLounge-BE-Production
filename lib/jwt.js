const crypto = require("crypto");

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function createSignature(unsignedToken, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(unsignedToken)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(payload, secret, expiresInSeconds) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const issuedAt = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedBody = toBase64Url(JSON.stringify(body));
  const unsignedToken = `${encodedHeader}.${encodedBody}`;
  const signature = createSignature(unsignedToken, secret);

  return `${unsignedToken}.${signature}`;
}

function verifyJwt(token, secret) {
  if (!token || typeof token !== "string") {
    throw new Error("A JWT token string is required.");
  }

  const [encodedHeader, encodedBody, signature] = token.split(".");

  if (!encodedHeader || !encodedBody || !signature) {
    throw new Error("Malformed JWT token.");
  }

  const unsignedToken = `${encodedHeader}.${encodedBody}`;
  const expectedSignature = createSignature(unsignedToken, secret);

  if (signature !== expectedSignature) {
    throw new Error("Invalid JWT signature.");
  }

  const header = JSON.parse(fromBase64Url(encodedHeader));
  const payload = JSON.parse(fromBase64Url(encodedBody));

  if (header.alg !== "HS256") {
    throw new Error("Unsupported JWT algorithm.");
  }

  if (typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("JWT token has expired.");
  }

  return payload;
}

module.exports = {
  signJwt,
  verifyJwt,
};
