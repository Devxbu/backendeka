class GeneralDTO {
  static toCommunityResponse(community) {
    if (!community) return null;
    return {
      id: community._id || community.id,
      type: community.type,
      image: community.image,
      category: community.category,
      title: community.title,
      companyName: community.companyName,
      budget: community.budget,
      description: community.description,
      location: community.location,
      date: community.date,
      link: community.link,
    };
  }

  static toFaqResponse(faq) {
    if (!faq) return null;
    return {
      id: faq._id || faq.id,
      question: faq.question,
      answer: faq.answer,
      topic: faq.topic,
      isActive: faq.isActive,
    };
  }

  static toContactResponse(msg) {
    if (!msg) return null;
    return {
      id: msg._id || msg.id,
      subject: msg.subject,
      message: msg.message,
      createdAt: msg.createdAt,
    };
  }
}

module.exports = GeneralDTO;
