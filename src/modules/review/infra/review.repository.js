const Review = require("../core/review.model");
const mongoose = require("mongoose");

class ReviewRepository {
  async create(data) {
    return Review.create(data);
  }

  async find(query = {}, options = {}) {
    const { limit = 20, page = 1, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    return Review.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate("userId", "name pfp")
      .populate("reviewedUserId", "name pfp")
      .lean();
  }

  async delete(id, userId) {
    return Review.findOneAndDelete({ _id: id, userId });
  }

  async setVisibility(id, userId) {
    return await Review.findOneAndUpdate(
      { _id: id, reviewedUserId: userId },
      [
        {
          $set: {
            isVisible: { $not: "$isVisible" },
          },
        },
      ],
      { new: true, updatePipeline: true },
    )
      .populate("userId", "pfp")
      .populate("reviewedUserId", "pfp");
  }

  async getAverageRating(reviewedUserId) {
    const stats = await Review.aggregate([
      {
        $match: {
          reviewedUserId: new mongoose.Types.ObjectId(reviewedUserId),
          isVisible: true,
        },
      },
      {
        $group: {
          _id: "$reviewedUserId",
          avgClear: { $avg: "$rating.clear" },
          avgTime: { $avg: "$rating.time" },
          avgCommitments: { $avg: "$rating.commitments" },
          avgTeam: { $avg: "$rating.team" },
          totalReviews: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          average: {
            $divide: [
              {
                $add: ["$avgClear", "$avgTime", "$avgCommitments", "$avgTeam"],
              },
              4,
            ],
          },
          breakdown: {
            clear: "$avgClear",
            time: "$avgTime",
            commitments: "$avgCommitments",
            team: "$avgTeam",
          },
          totalReviews: 1,
        },
      },
    ]);

    return (
      stats[0] || {
        average: 0,
        totalReviews: 0,
        breakdown: { clear: 0, time: 0, commitments: 0, team: 0 },
      }
    );
  }
}

module.exports = new ReviewRepository();
