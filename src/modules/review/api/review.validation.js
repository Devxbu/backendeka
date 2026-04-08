const Joi = require("joi");

const createReview = {
  body: Joi.object().keys({
    reviewedUserId: Joi.string().required(),
    projectId: Joi.string(),
    type: Joi.string().valid("testimonial", "review").required(),
    publicComment: Joi.string().trim(),
    privateComment: Joi.string().trim(),
    rating: Joi.object().keys({
      clear: Joi.number().min(0).max(5),
      time: Joi.number().min(0).max(5),
      commitments: Joi.number().min(0).max(5),
      team: Joi.number().min(0).max(5),
    }),
  }),
};

const getReview = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const hideReview = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

module.exports = {
  createReview,
  getReview,
  hideReview,
};
