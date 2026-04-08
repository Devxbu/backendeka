const notificationRepository = require("../infra/notification.repository");
const cacheService = require("../../../shared/utils/cache.service");
const ApiError = require("../../../shared/errors/apiError");

class NotificationService {
  constructor(repository) {
    this.repository = repository;
    this.CACHE_PREFIX = "notification:unread_count:";
    this.CACHE_TTL = 3600; // 1 hour
  }

  async getNotifications(userId, options) {
    return this.repository.find({ userId }, options);
  }

  async getNotification(id, userId) {
    const notification = await this.repository.findById(id);
    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    if (notification.userId.toString() !== userId.toString()) {
      throw new ApiError(403, "Unauthorized access to notification");
    }

    return notification;
  }

  async createNotification(data) {
    const notification = await this.repository.create(data);
    await this._invalidateUnreadCount(data.userId);
    return notification;
  }

  async updateNotification(id, data) {
    const notification = await this.repository.update(id, data);
    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }
    await this._invalidateUnreadCount(notification.userId);
    return notification;
  }

  async deleteNotification(id, userId) {
    const notification = await this.getNotification(id, userId);
    await this.repository.softDelete(id);
    await this._invalidateUnreadCount(userId);
    return notification;
  }

  async markAllAsRead(userId) {
    await this.repository.markAllAsRead(userId);
    await this._invalidateUnreadCount(userId);
  }

  async getUnreadCount(userId) {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    const cachedCount = await cacheService.get(cacheKey);

    if (cachedCount !== null) {
      return parseInt(cachedCount);
    }

    const count = await this.repository.countUnread(userId);
    await cacheService.set(cacheKey, count, this.CACHE_TTL);
    return count;
  }

  async _invalidateUnreadCount(userId) {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    await cacheService.del(cacheKey);
  }
}

module.exports = new NotificationService(notificationRepository);
