const reviewService = require("../core/review.service");
const reviewDTO = require("./review.dto");
const catchAsync = require("../../../shared/utils/asyncHandler");

module.exports.getReview = catchAsync(async (req, res) => {
  const reviewedUserId = req.params.id;
  const { limit, page } = req.query;

  const reviews = await reviewService.getUserReviews(reviewedUserId, {
    limit: parseInt(limit) || 20,
    page: parseInt(page) || 1,
  });

  const stats = await reviewService.getAverageRating(reviewedUserId);

  res.status(200).json({
    reviews: reviewDTO.toList(reviews),
    stats,
  });
});

module.exports.createReview = catchAsync(async (req, res) => {
  const review = await reviewService.createReview(req.body, req.user.userId);
  res.status(201).json(reviewDTO.toResponse(review));
});

module.exports.deleteReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  await reviewService.deleteReview(id, req.user.userId);
  res.status(204).send();
});

module.exports.hideReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const review = await reviewService.setVisibility(id, req.user.userId);
  res.status(200).json(reviewDTO.toResponse(review));
});
