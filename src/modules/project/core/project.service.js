const projectRepository = require("../infra/project.repository");
const cacheService = require("../../../shared/utils/cache.service");
const fileService = require("../../../shared/core/file.service");
const ApiError = require("../../../shared/errors/apiError");

class ProjectService {
  constructor(repository) {
    this.repository = repository;
  }

  async _mapProjectProfileImages(project) {
    if (!project) return project;
    if (
      project.userId &&
      project.userId.pfp &&
      !project.userId.pfp.startsWith("http")
    ) {
      project.userId.pfp = await fileService.getFileUrl(project.userId.pfp);
    }
    if (
      project.partnerId &&
      project.partnerId.pfp &&
      !project.partnerId.pfp.startsWith("http")
    ) {
      project.partnerId.pfp = await fileService.getFileUrl(
        project.partnerId.pfp,
      );
    }
    return project;
  }

  async getProjects(userId, options) {
    const query = { $or: [{ userId }, { partnerId: userId }] };
    const projects = await this.repository.find(query, options);
    return Promise.all(
      projects.map((project) =>
        this._mapProjectProfileImages({
          ...(project.toObject ? project.toObject() : project),
        }),
      ),
    );
  }

  async getProject(id, userId) {
    let project = await this.repository.findById(id, userId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    return this._mapProjectProfileImages({
      ...(project.toObject ? project.toObject() : project),
    });
  }

  async createProjectRequest(userId, data) {
    data.userId = userId;
    const project = await this.repository.create({
      ...data,
      progress: "requested",
      isApproved: false,
    });
    return this._mapProjectProfileImages(project);
  }

  async updateProject(id, userId, data) {
    const project = await this.repository.update(id, userId, data);
    return this._mapProjectProfileImages(project);
  }

  async deleteProject(id, userId) {
    return await this.repository.delete(id, userId);
  }
}

module.exports = new ProjectService(projectRepository);
