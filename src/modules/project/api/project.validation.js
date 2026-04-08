const Joi = require("joi");

const createProjectRequest = {
  body: Joi.object().keys({
    partnerId: Joi.string().required(),
    name: Joi.string().required().trim(),
    description: Joi.string().required().trim(),
    categories: Joi.string(),
    budget: Joi.object().keys({
      min: Joi.number(),
      max: Joi.number(),
    }),
    language: Joi.array().items(Joi.string()),
    tools: Joi.array().items(Joi.string()),
    startDate: Joi.date(),
    endDate: Joi.date(),
  }),
};

const updateProject = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string().trim(),
    description: Joi.string().trim(),
    categories: Joi.string(),
    budget: Joi.object().keys({
      min: Joi.number(),
      max: Joi.number(),
    }),
    finalPrice: Joi.number(),
    language: Joi.array().items(Joi.string()),
    tools: Joi.array().items(Joi.string()),
    startDate: Joi.date(),
    endDate: Joi.date(),
    progress: Joi.string().valid(
      "in_progress",
      "completed",
      "cancelled",
      "requested",
    ),
  }),
};

const snoozeProject = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    snoozeDate: Joi.date().required(),
  }),
};

const getProject = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const getProjects = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100).default(20),
    page: Joi.number().integer().min(1).default(1),
  }),
};

module.exports = {
  createProjectRequest,
  updateProject,
  snoozeProject,
  getProject,
  getProjects,
};
