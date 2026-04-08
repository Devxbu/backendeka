const express = require("express");
const router = express.Router();

const messageController = require("./message.controller");
const messageValidation = require("./message.validation");
const validate = require("../../../shared/middlewares/validate.middleware");
const authToken = require("../../../middlewares/auth");

// Apply auth middleware to all routes
router.use(authToken);

router.get("/get-conversations", messageController.getConversations);

router.get(
  "/get-conversation/:id",
  validate(messageValidation.getConversation),
  messageController.getConversation,
);

router.post(
  "/send-message",
  validate(messageValidation.sendMessage),
  messageController.sendMessage,
);

router.delete(
  "/delete-conversation/:id",
  validate(messageValidation.deleteConversation),
  messageController.deleteConversation,
);

router.patch(
  "/mark-as-read/:id",
  validate(messageValidation.markAsRead),
  messageController.markAsRead,
);

module.exports = router;
