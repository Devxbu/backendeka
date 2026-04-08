const Joi = require("joi");

const getConversation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const sendMessage = {
  body: Joi.object().keys({
    receiverId: Joi.string().required(),
    message: Joi.string().required().min(1),
  }),
};

const deleteConversation = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const markAsRead = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

module.exports = {
  getConversation,
  sendMessage,
  deleteConversation,
  markAsRead,
};
