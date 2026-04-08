const express = require("express");
const router = express.Router();

const notificationController = require("./notification.controller");
const notificationValidation = require("./notification.validation");
const validate = require("../../../shared/middlewares/validate.middleware");
const auth = require("../../../middlewares/auth");
const authorize = require("../../../middlewares/permission");

router.use(auth);

router.get("/get-notifications", notificationController.getNotifications);

router.get("/get-notification/:id", notificationController.getNotification);

router.patch("/mark-all-as-read", notificationController.markAllAsRead);

// Admin or Internal only (restricted to admin for API exposure)
router.post(
  "/create-notification",
  authorize("admin"),
  notificationController.createNotification,
);

router.put(
  "/update-notification/:id",
  authorize("admin"),
  notificationController.updateNotification,
);

router.delete(
  "/delete-notification/:id",
  authorize("admin"),
  notificationController.deleteNotification,
);

module.exports = router;
