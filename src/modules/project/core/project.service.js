const projectRepository = require("../infra/project.repository");
const cacheService = require("../../../shared/utils/cache.service");
const fileService = require("../../../shared/core/file.service");
const ApiError = require("../../../shared/errors/apiError");
const notificationService = require("../../notification/core/notification.service");

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
          incoming: project.partnerId._id.toString() === userId.toString(),
        }),
      ),
    );
  }

  async getProject(id, userId) {
    let project = await this.repository.findById(id, userId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }
    project.incoming = project.partnerId === userId;

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
    project.incoming = project.partnerId === userId;
    await notificationService.createNotification({
      userId: project.partnerId,
      type: "project",
      name: "Project Request",
      description: `${project.userId.name} has requested a project`,
      link: `/project/${project._id}`,
    });
    return this._mapProjectProfileImages(project);
  }

  async getProjectForMessage(userId, partnerId) {
    const query = {
      $or: [
        { userId: userId, partnerId: partnerId },
        { userId: partnerId, partnerId: userId },
      ],
    };
    const projects = await this.repository.find(query);
    return Promise.all(
      projects.map((project) =>
        this._mapProjectProfileImages({
          ...(project.toObject ? project.toObject() : project),
          incoming: project.partnerId._id.toString() === userId.toString(),
        }),
      ),
    );
  }

  async updateProject(id, userId, data) {
    const project = await this.repository.update(id, userId, data);
    if (data.progress === "in_progress") {
      await notificationService.createNotification({
        userId: project.userId,
        type: "project",
        name: "Project Accepted",
        description: `${project.partnerId.name} has accepted your project request`,
        link: `/project/${project._id}`,
      });
    }
    if (data.progress === "completed") {
      await notificationService.createNotification({
        userId: project.partnerId,
        type: "project",
        name: "Project Completed",
        description: `${project.userId.name} has completed the project`,
        link: `/project/${project._id}`,
      });
    }
    project.incoming = project.partnerId === userId;
    return this._mapProjectProfileImages(project);
  }

  async deleteProject(id, userId) {
    return await this.repository.delete(id, userId);
  }
}

module.exports = new ProjectService(projectRepository);
