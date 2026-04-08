const authService = require("../core/services/auth.service");
const catchAsync = require("../../../shared/utils/asyncHandler");
const ApiResponse = require("../../../shared/utils/apiResponse");

const getClientInfo = (req) => {
  return {
    ipAddress:
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
  };
};

// Cookie Options
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

module.exports.register = catchAsync(async (req, res) => {
  const { email, password, companyName } = req.body;
  const { ipAddress } = getClientInfo(req);

  const result = await authService.register({
    email,
    password,
    companyName,
    ipAddress,
  });
  return res.status(201).json(ApiResponse.created(result));
});

module.exports.changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { authId } = req.user;
  const result = await authService.changePassword({
    authId,
    oldPassword,
    newPassword,
  });
  return res.status(200).json(ApiResponse.success(result));
});

module.exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { ipAddress, userAgent } = getClientInfo(req);

  const result = await authService.login({
    email,
    password,
    ipAddress,
    userAgent,
  });

  if (result.refreshToken) {
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
    delete result.refreshToken;
  }

  return res.status(200).json(ApiResponse.success(result));
});

module.exports.logout = catchAsync(async (req, res) => {
  const accessTokenId = req.user.tokenId;
  const refreshToken = req.cookies.refreshToken;

  // Handled by service or validation, but safe guard here
  if (!refreshToken) {
    return res.status(200).json(ApiResponse.success({ message: "Already logged out" }));
  }

  const [refreshTokenId] = refreshToken.split(".") || [];
  const result = await authService.logout({ accessTokenId, refreshTokenId });

  res.clearCookie("refreshToken");
  return res.status(200).json(ApiResponse.success(result));
});

module.exports.logoutAll = catchAsync(async (req, res) => {
  const { authId } = req.user;
  await authService.logoutAll(authId);
  res.clearCookie("refreshToken");
  return res.status(200).json(ApiResponse.success({ message: "Logged out from all devices" }));
});

module.exports.refreshToken = catchAsync(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const { ipAddress } = getClientInfo(req);

  if (!refreshToken) {
    // If no token, 401 is appropriate
    return res.status(401).json({ success: false, message: "Refresh token not found", data: {} });
  }

  const result = await authService.refreshToken({
    cmRefreshToken: refreshToken,
    ipAddress,
  });

  if (result.refreshToken) {
    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
    delete result.refreshToken;
  }
  return res.status(200).json(ApiResponse.success(result));
});

module.exports.verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.query;
  const result = await authService.verifyEmail({ token });
  return res.status(200).json(ApiResponse.success(result));
});

module.exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const { ipAddress } = getClientInfo(req);

  const result = await authService.forgotPassword({ email, ipAddress });
  return res.status(200).json(ApiResponse.success(result));
});

module.exports.resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;
  const { ipAddress } = getClientInfo(req);

  const result = await authService.resetPassword({
    token,
    password,
    ipAddress,
  });
  return res.status(200).json(ApiResponse.success(result));
});
