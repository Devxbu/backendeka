const jwt = require("jsonwebtoken");
const accessTokenRedis = require("../utils/accessTokenRedis");
const env = require("../config/env");
const ApiError = require("../shared/errors/apiError");

const authToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Missing or invalid authorization header");
    }

    const accessToken = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(accessToken, env.JWT_SECRET);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired token");
    }

    const user = await accessTokenRedis.getAccessToken(decoded.tokenId);

    if (!user) {
      throw new ApiError(401, "Session expired or invalid token");
    }
    user.userId = user.companyId;
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authToken;
