class ContentDTO {
  static toResponse(content) {
    if (!content) return null;
    return {
      id: content._id || content.id,
      companyId: {
        _id: content.companyId._id,
        name: content.companyId.name,
        pfp: content.companyId.pfp,
      },
      title: content.title,
      description: content.description,
      image: content.image,
      type: content.type,
      studioContentType: content.studioContentType,
      category: content.category,
      showFeed: content.showFeed,
      links: content.links,
      likes: content.likes,
      saves: content.saves,
      opportunity: content.opportunity,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };
  }

  static toFeed(contents) {
    if (!contents) return [];
    return contents.map((content) => this.toResponse(content));
  }
}

module.exports = ContentDTO;
