const reviewRepository = require("../infra/review.repository");
const cacheService = require("../../../shared/utils/cache.service");
const fileService = require("../../../shared/core/file.service");
const ApiError = require("../../../shared/errors/apiError");

class ReviewService {
  constructor(repository) {
    this.repository = repository;
    this.CACHE_PREFIX = "review:rating:";
    this.CACHE_TTL = 86400; // 24 hours
  }

  async _mapReviewProfileImages(review) {
    if (!review) return review;
    if (
      review.userId &&
      review.userId.pfp &&
      !review.userId.pfp.startsWith("http")
    ) {
      review.userId.pfp = await fileService.getFileUrl(review.userId.pfp);
    }
    if (
      review.reviewedUserId &&
      review.reviewedUserId.pfp &&
      !review.reviewedUserId.pfp.startsWith("http")
    ) {
      review.reviewedUserId.pfp = await fileService.getFileUrl(
        review.reviewedUserId.pfp,
      );
    }
    return review;
  }

  async getUserReviews(reviewedUserId, options) {
    const reviews = await this.repository.find(
      { reviewedUserId, isVisible: true },
      options,
    );
    return Promise.all(
      reviews.map((review) =>
        this._mapReviewProfileImages({
          ...(review.toObject ? review.toObject() : review),
        }),
      ),
    );
  }

  async createReview(data, userId) {
    data.userId = userId;
    const review = await this.repository.create(data);
    await this._invalidateRatingCache(data.reviewedUserId);
    return review;
  }

  async deleteReview(id, userId) {
    const review = await this.repository.delete(id, userId);
    await this._invalidateRatingCache(review.reviewedUserId);
    return review;
  }

  async setVisibility(id, userId) {
    const review = await this.repository.setVisibility(id, userId);
    await this._invalidateRatingCache(review.reviewedUserId);
    return this._mapReviewProfileImages(review);
  }

  async getAverageRating(reviewedUserId) {
    const cacheKey = `${this.CACHE_PREFIX}${reviewedUserId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const stats = await this.repository.getAverageRating(reviewedUserId);
    await cacheService.set(cacheKey, stats, this.CACHE_TTL);
    return stats;
  }

  async _invalidateRatingCache(reviewedUserId) {
    const cacheKey = `${this.CACHE_PREFIX}${reviewedUserId}`;
    await cacheService.del(cacheKey);
  }
}

module.exports = new ReviewService(reviewRepository);
