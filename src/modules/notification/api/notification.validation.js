const Joi = require("joi");

const createNotification = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    type: Joi.string()
      .valid("project", "message", "mention", "settings", "content")
      .required(),
    name: Joi.string().trim(),
    message: Joi.string().trim(),
    description: Joi.string().trim(),
    link: Joi.string().trim(),
  }),
};

const updateNotification = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    type: Joi.string()
      .valid("project", "message", "mention", "settings", "content")
      .required(),
    name: Joi.string().trim(),
    message: Joi.string().trim(),
    description: Joi.string().trim(),
    link: Joi.string().trim(),
    isRead: Joi.boolean(),
    isDeleted: Joi.boolean(),
  }),
};

const getNotification = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

module.exports = {
  createNotification,
  updateNotification,
  getNotification,
};
