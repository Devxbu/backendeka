const Content = require("../core/content.model");

class ContentRepository {
  async create(data) {
    const content = await Content.create(data);
    await content.populate([{ path: "companyId", select: "name pfp" }]);
    return content;
  }

  async find(query = {}, options = {}) {
    const { limit = 10, page = 1, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    return Content.find({ ...query })
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate("companyId", "name pfp")
      .lean();
  }

  async findById(id) {
    return Content.findOne({ _id: id })
      .populate("companyId", "name pfp")
      .lean();
  }

  async incrementLikes(id, increment = 1) {
    return Content.findOneAndUpdate(
      { _id: id },
      { $inc: { likes: increment } },
      { new: true, lean: true },
    );
  }

  async incrementSaves(id, increment = 1) {
    return Content.findOneAndUpdate(
      { _id: id },
      { $inc: { saves: increment } },
      { new: true, lean: true },
    );
  }
  async update(id, data) {
    return await Content.findOneAndUpdate({ _id: id }, data, { new: true })
      .populate({ path: "companyId", select: "name pfp" })
      .lean();
  }

  async delete(id) {
    return Content.findByIdAndDelete(id);
  }

  async count(query = {}) {
    return Content.countDocuments({ ...query });
  }
}

module.exports = new ContentRepository();
