class NotificationDTO {
  static toResponse(notification) {
    if (!notification) return null;
    return {
      id: notification._id || notification.id,
      userId: notification.userId,
      type: notification.type,
      name: notification.name,
      message: notification.message,
      description: notification.description,
      link: notification.link,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }

  static toList(notifications) {
    if (!notifications) return [];
    return notifications.map((notification) => this.toResponse(notification));
  }
}

module.exports = NotificationDTO;
