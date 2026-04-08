const { Community, ContactMessage } = require("../core/general.model");

class GeneralRepository {
  async findCommunities(query = {}, options = {}) {
    const { limit = 20, page = 1 } = options;
    return Community.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .lean();
  }

  async findCommunityById(id) {
    return Community.findById(id).lean();
  }

  async deleteCommunity(id) {
    return Community.findByIdAndDelete(id);
  }

  async createCommunity(data) {
    return Community.create(data);
  }

  // MESSAGES
  async createMessage(data) {
    return ContactMessage.create(data);
  }

  async findMessages(query = {}, options = {}) {
    const { limit = 20, page = 1 } = options;
    return ContactMessage.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .lean();
  }
}

module.exports = new GeneralRepository();
