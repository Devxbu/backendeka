const Joi = require("joi");

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    companyName: Joi.string().required(),
    password: Joi.string().required().regex(passwordPattern).messages({
      "string.pattern.base":
        "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
    }),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

const logout = {
  // logout functionality is handled via cookies/tokens, usually no body validation needed
  // but if we accept optional params, we can add them here
};

const refreshToken = {
  // refreshToken acts on cookies primarily, but sometimes passed in body
  // The current controller logic looks for cookies.refreshToken.
  // Validation middleware usually checks body/query/params.
  // We can validate strict absence of body if we want strictness.
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required().regex(passwordPattern).messages({
      "string.pattern.base":
        "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
    }),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    token: Joi.string().required(),
    password: Joi.string().required().regex(passwordPattern).messages({
      "string.pattern.base":
        "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
    }),
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
