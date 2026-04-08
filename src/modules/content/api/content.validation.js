const Joi = require("joi");

const createContent = {
  body: Joi.object().keys({
    title: Joi.string().required().trim(),
    description: Joi.string().trim(),
    type: Joi.string()
      .valid(
        "case_study",
        "studio_content",
        "collaboration",
        "project_opportunity"
      )
      .required(),
    studioContentType: Joi.string().valid("article", "videos", "podcast"),
    category: Joi.string(),
    showFeed: Joi.boolean().default(true),
    links: Joi.array().items(
      Joi.object().keys({
        name: Joi.string(),
        url: Joi.string().uri(),
      })
    ),
    opportunity: Joi.object().keys({
      category: Joi.string().trim(),
      startDate: Joi.date(),
      endDate: Joi.date(),
      budget: Joi.object().keys({
        min: Joi.number(),
        max: Joi.number(),
      }),
      tools: Joi.array().items(Joi.string()),
      language: Joi.array().items(Joi.string()),
    }),
  }),
};

const updateContent = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    title: Joi.string().trim(),
    description: Joi.string().trim(),
    type: Joi.string().valid(
      "case_study",
      "studio_content",
      "collaboration",
      "project_opportunity"
    ),
    studioContentType: Joi.string().valid("article", "videos", "podcast"),
    category: Joi.string(),
    showFeed: Joi.boolean(),
    links: Joi.array().items(
      Joi.object().keys({
        name: Joi.string(),
        url: Joi.string().uri(),
      })
    ),
    opportunity: Joi.object().keys({
      category: Joi.string().trim(),
      startDate: Joi.date(),
      endDate: Joi.date(),
      budget: Joi.object().keys({
        min: Joi.number(),
        max: Joi.number(),
      }),
      tools: Joi.array().items(Joi.string()),
      language: Joi.array().items(Joi.string()),
    }),
  }),
};

const getContentById = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const getContentByUserId = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

module.exports = {
  createContent,
  updateContent,
  getContentById,
  getContentByUserId,
};
