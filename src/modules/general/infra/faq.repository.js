const { FaqModel } = require("../core/general.model");

class FaqRepository {
  async create(data) {
    const faq = await FaqModel.create(data);
    return faq.toObject();
  }
  async update(id, data) {
    return FaqModel.findByIdAndUpdate(id, data, { new: true, lean: true });
  }
  async delete(id) {
    return FaqModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true, lean: true },
    );
  }
  async findById(id) {
    return FaqModel.findById(id).select("question answer topic").lean();
  }
  async findByName(topic) {
    return FaqModel.find({ topic, isActive: true })
      .select("question answer topic")
      .lean();
  }
  async findAll() {
    return FaqModel.find({ isActive: true })
      .select("question answer topic")
      .sort({ topic: 1 })
      .lean();
  }

  // Bulk operations for Topics
  async updateTopicName(oldTopic, newTopic) {
    return FaqModel.updateMany(
      { topic: oldTopic, isActive: true },
      { topic: newTopic },
    );
  }

  async deleteTopic(topic) {
    return FaqModel.updateMany({ topic, isActive: true }, { isActive: false });
  }

  async distinctTopics() {
    return FaqModel.find({ isActive: true }).distinct("topic");
  }

  async exists(query) {
    return FaqModel.exists({ ...query, isActive: true });
  }
}

module.exports = new FaqRepository();
