const MessageService = require("../core/message.service");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const messageDTO = require("./message.dto");

// Get conversations of a user
module.exports.getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const conversations = await MessageService.getConversations(userId);
  res.status(200).json(messageDTO.toMessageList(conversations));
});

// Get conversation between two users
module.exports.getConversation = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const conversation = await MessageService.getConversation(
    userId,
    req.params.id,
  );
  res.status(200).json({
    messages: messageDTO.toList(conversation.conversation),
    pfp: conversation.pfp,
  });
});

// Send message
module.exports.sendMessage = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { receiverId, message } = req.body;
  const result = await MessageService.sendMessage(userId, receiverId, message);
  res.status(201).json(messageDTO.toItem(result));
});

// Set messages as deleted
module.exports.deleteConversation = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  await MessageService.deleteConversation(userId, req.params.id);
  res.status(204).send();
});

// Set messages as read
module.exports.markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  await MessageService.markAsRead(userId, req.params.id);
  res.status(200).json({ success: true });
});
