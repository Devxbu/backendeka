class ProjectDTO {
  static toResponse(project) {
    if (!project) return null;
    return {
      id: project._id || project.id,
      name: project.name,
      description: project.description,
      categories: project.categories,
      budget: project.budget,
      language: project.language,
      tools: project.tools,
      startDate: project.startDate,
      endDate: project.endDate,
      progress: project.progress,
      isApproved: project.isApproved,
      finalPrice: project.finalPrice,
      approvedDate: project.approvedDate,
      snoozedEndDate: project.snoozedEndDate,
      userId: {
        _id: project.userId._id,
        name: project.userId.name,
        pfp: project.userId.pfp,
      },
      partnerId: {
        _id: project.partnerId._id,
        name: project.partnerId.name,
        pfp: project.partnerId.pfp,
      },
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  static toList(projects) {
    if (!projects) return [];
    return projects.map((project) => this.toResponse(project));
  }
}

module.exports = ProjectDTO;
