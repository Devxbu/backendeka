const Joi = require("joi");

const updateProfile = {
  body: Joi.object().keys({
    name: Joi.string().trim(),
    country: Joi.string(),
    city: Joi.string(),
    employees: Joi.string(),
    foundingYear: Joi.number()
      .integer()
      .min(1800)
      .max(new Date().getFullYear()),
    languages: Joi.array().items(Joi.string()),
    tools: Joi.array().items(Joi.string()),
    industry: Joi.array().items(Joi.string()),
    workingPreference: Joi.string().valid(
      "remote",
      "hybrid",
      "onsite",
      "freelance",
    ),
    bio: Joi.string(),
    address: Joi.string(),
    taxNumber: Joi.string(),
    areas: Joi.array().items(
      Joi.object().keys({
        category: Joi.string().required(),
        subCategory: Joi.string().required(),
      }),
    ),
    socials: Joi.array().items(
      Joi.object().keys({
        name: Joi.string().required(),
        link: Joi.string().uri().required(),
      }),
    ),
  }),
};

const browse = {
  body: Joi.object().keys({
    search: Joi.string().allow("", null),
    limit: Joi.number().integer().min(1).max(100).default(20),
    page: Joi.number().integer().min(1).default(1),
    industry: Joi.string(),
    country: Joi.string(),
    city: Joi.string(),
    name: Joi.string(),
    employees: Joi.string(),
    workingPreference: Joi.string().valid(
      "remote",
      "hybrid",
      "onsite",
      "freelance",
    ),
    languages: Joi.array().items(Joi.string()),
    tools: Joi.array().items(Joi.string()),
    areas: Joi.array().items(
      Joi.object().keys({
        category: Joi.string().required(),
        subCategory: Joi.string().required(),
      }),
    ),
    savedStudios: Joi.array().items(Joi.string()),
  }),
};

const discover = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100).default(20),
    page: Joi.number().integer().min(1).default(1),
    industry: Joi.string(),
    country: Joi.string(),
    city: Joi.string(),
    name: Joi.string(),
    employees: Joi.string(),
    workingPreference: Joi.string().valid(
      "remote",
      "hybrid",
      "onsite",
      "freelance",
    ),
    languages: Joi.array().items(Joi.string()),
    tools: Joi.array().items(Joi.string()),
    areas: Joi.array().items(
      Joi.object().keys({
        category: Joi.string().required(),
        subCategory: Joi.string().required(),
      }),
    ),
    savedStudios: Joi.array().items(Joi.string()),
  }),
};

const getProfile = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const saveProfile = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

module.exports = {
  updateProfile,
  browse,
  discover,
  getProfile,
  saveProfile,
};
