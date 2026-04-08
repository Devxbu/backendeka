const Project = require("../core/project.model");
const mongoose = require("mongoose");

class ProjectRepository {
  async find(query = {}, options = {}) {
    const { limit = 20, page = 1, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    return Project.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate("userId", "name pfp")
      .populate("partnerId", "name pfp")
      .lean();
  }

  async findById(id, userId) {
    return Project.findOne({
      _id: id,
      $or: [{ userId: userId }, { partnerId: userId }],
    })
      .populate("userId", "name pfp")
      .populate("partnerId", "name pfp")
      .lean();
  }

  async create(data) {
    const project = await Project.create(data);

    await project.populate([
      { path: "userId", select: "name pfp" },
      { path: "partnerId", select: "name pfp" },
    ]);

    return project;
  }

  async update(id, userId, data) {
    const project = await Project.findOneAndUpdate(
      {
        _id: id,
        $or: [{ userId: userId }, { partnerId: userId }],
      },
      data,
      { new: true },
    );

    await project.populate([
      { path: "userId", select: "name pfp" },
      { path: "partnerId", select: "name pfp" },
    ]);

    return project;
  }

  async delete(id, userId) {
    return Project.findOneAndDelete({
      _id: id,
      userId: userId,
    });
  }
}

module.exports = new ProjectRepository();
