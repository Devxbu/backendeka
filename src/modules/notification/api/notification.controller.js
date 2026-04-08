const notificationService = require("../core/notification.service");
const notificationDTO = require("./notification.dto");
const catchAsync = require("../../../shared/utils/asyncHandler");

module.exports.getNotifications = catchAsync(async (req, res) => {
  const { limit, page } = req.query;
  const notifications = await notificationService.getNotifications(
    req.user.userId,
    {
      limit: parseInt(limit) || 20,
      page: parseInt(page) || 1,
    },
  );
  const unreadCount = await notificationService.getUnreadCount(req.user.userId);

  res.status(200).json({
    notifications: notificationDTO.toList(notifications),
    unreadCount,
  });
});

module.exports.getNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  const notification = await notificationService.getNotification(
    id,
    req.user.userId,
  );
  res.status(200).json(notificationDTO.toResponse(notification));
});

module.exports.markAllAsRead = catchAsync(async (req, res) => {
  await notificationService.markAllAsRead(req.user.userId);
  res.status(200).json({ message: "All notifications marked as read" });
});

module.exports.createNotification = catchAsync(async (req, res) => {
  const notification = await notificationService.createNotification(req.body);
  res.status(201).json(notificationDTO.toResponse(notification));
});

module.exports.updateNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  const notification = await notificationService.updateNotification(
    id,
    req.body,
  );
  res.status(200).json(notificationDTO.toResponse(notification));
});

module.exports.deleteNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  await notificationService.deleteNotification(id, req.user.userId);
  res.status(200).json({ message: "Notification deleted successfully" });
});
