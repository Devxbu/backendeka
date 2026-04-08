const Notification = require("../core/notification.model");

class NotificationRepository {
  async create(data) {
    return Notification.create(data);
  }

  async find(query = {}, options = {}) {
    const { limit = 20, page = 1, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    return Notification.find({ ...query, isDeleted: false })
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean();
  }

  async findById(id) {
    return Notification.findOne({ _id: id, isDeleted: false }).lean();
  }

  async update(id, data) {
    return Notification.findOneAndUpdate({ _id: id, isDeleted: false }, data, {
      new: true,
      lean: true,
    });
  }

  async softDelete(id) {
    return Notification.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true, lean: true },
    );
  }

  async markAllAsRead(userId) {
    return Notification.updateMany(
      { userId, isRead: false, isDeleted: false },
      { isRead: true },
    );
  }

  async countUnread(userId) {
    return Notification.countDocuments({
      userId,
      isRead: false,
      isDeleted: false,
    });
  }
}

module.exports = new NotificationRepository();
