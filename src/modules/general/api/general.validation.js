const Joi = require("joi");

const sendMessage = {
  body: Joi.object().keys({
    subject: Joi.string().required().trim(),
    message: Joi.string().required().trim(),
  }),
};

const createCommunity = {
  body: Joi.object().keys({
    type: Joi.string().valid("events", "contest", "rfp").required(),
    category: Joi.string().required(),
    title: Joi.string().required(),
    companyName: Joi.string(),
    budget: Joi.string(),
    description: Joi.string(),
    location: Joi.string(),
    date: Joi.date(),
    link: Joi.string().uri().required(),
  }),
};

const createFaq = {
  body: Joi.object().keys({
    question: Joi.string().required().trim(),
    answer: Joi.string().required().trim(),
    topic: Joi.string().required().trim(),
  }),
};

const updateFaq = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    question: Joi.string().trim(),
    answer: Joi.string().trim(),
    topic: Joi.string().trim(),
    isActive: Joi.boolean(),
  }),
};

const genericIdParam = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

module.exports = {
  sendMessage,
  createCommunity,
  createFaq,
  updateFaq,
  genericIdParam,
};
