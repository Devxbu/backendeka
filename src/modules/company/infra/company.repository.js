const Company = require("../core/company.model");

class CompanyRepository {
  async create(data) {
    return Company.create(data);
  }

  async findByAuthId(authId) {
    return Company.findOne({ authId }).lean();
  }
  async findById(id) {
    return (
      Company.findById(id)
        // .populate("categories", "name")
        .lean()
    );
  }

  async discover(filters = {}, options = {}) {
    const { limit = 20, page = 1, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const query = { ...filters };

    const [results, total] = await Promise.all([
      Company.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .select("name slug pfp bio location categories badges plan")
        .lean(),
      Company.countDocuments(query),
    ]);

    return { results, total, page, limit };
  }

  async updateById(id, data) {
    return Company.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { new: true, runValidators: true, lean: true },
    );
  }
  async deleteById(id) {
    return Company.findByIdAndDelete(id);
  }
}

module.exports = new CompanyRepository();
