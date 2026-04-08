const projectService = require("../core/project.service");
const projectDTO = require("./project.dto");
const catchAsync = require("../../../shared/utils/asyncHandler");

module.exports.getProjects = catchAsync(async (req, res) => {
  const { limit, page } = req.query;
  const projects = await projectService.getProjects(req.user.userId, {
    limit: parseInt(limit) || 20,
    page: parseInt(page) || 1,
  });

  res.status(200).json(projects);
});

module.exports.getProjectById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const project = await projectService.getProject(id, req.user.userId);
  res.status(200).json(project);
});

module.exports.snoozeProject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { snoozeDate } = req.body;
  const updated = await projectService.updateProject(id, req.user.userId, {
    snoozedEndDate: snoozeDate,
  });
  res.status(200).json(updated);
});

module.exports.acceptProject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updated = await projectService.updateProject(id, req.user.userId, {
    isApproved: true,
    approvedDate: new Date(),
    progress: "in_progress",
  });
  res.status(200).json(updated);
});

module.exports.createProjectRequest = catchAsync(async (req, res) => {
  const project = await projectService.createProjectRequest(
    req.user.userId,
    req.body,
  );
  res.status(201).json(project);
});

module.exports.updateProject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updated = await projectService.updateProject(
    id,
    req.user.userId,
    req.body,
  );
  res.status(200).json(updated);
});

module.exports.deleteProject = catchAsync(async (req, res) => {
  const { id } = req.params;
  await projectService.deleteProject(id, req.user.userId);
  res.status(204).send();
});
