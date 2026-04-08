class ReviewDTO {
  static toResponse(review) {
    if (!review) return null;
    return {
      id: review._id || review.id,
      userId: {
        _id: review.userId._id,
        name: review.userId.name,
        pfp: review.userId.pfp,
      },
      reviewedUserId: {
        _id: review.reviewedUserId._id,
        name: review.reviewedUserId.name,
        pfp: review.reviewedUserId.pfp,
      },
      projectId: review.projectId,
      type: review.type,
      publicComment: review.publicComment,
      privateComment: review.privateComment,
      rating: review.rating,
      isVisible: review.isVisible,
      createdAt: review.createdAt,
    };
  }

  static toList(reviews) {
    if (!reviews) return [];
    return reviews.map((review) => this.toResponse(review));
  }
}

module.exports = ReviewDTO;
