const express = require("express");
const router = express.Router();
const extractToken = require("../../../middlewares/extractToken");
const authController = require("./auth.controller");
const validate = require("../../../shared/middlewares/validate.middleware");
const authValidation = require("./auth.validation");
const rateLimiter = require("../../../middlewares/rateLimiter");

const authLimit = rateLimiter({ window: 15 * 60, limit: 5, keyPrefix: "auth" });

router.post(
  "/register",
  authLimit,
  validate(authValidation.register),
  authController.register,
);
router.post(
  "/login",
  authLimit,
  validate(authValidation.login),
  authController.login,
);
router.post("/refresh", authController.refreshToken);
router.post("/logout", extractToken, authController.logout);
router.post("/logout-all", extractToken, authController.logoutAll);
router.post(
  "/forgot-password",
  authLimit,
  validate(authValidation.forgotPassword),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  validate(authValidation.resetPassword),
  authController.resetPassword,
);
router.post(
  "/change-password",
  extractToken,
  validate(authValidation.changePassword),
  authController.changePassword,
);
router.get(
  "/verify-email",
  validate(authValidation.verifyEmail),
  authController.verifyEmail,
);

module.exports = router;
