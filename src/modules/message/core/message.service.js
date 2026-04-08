const MessageRepository = require("../infra/message.repository");
const { getIO } = require("../../../core/socket");
const ApiError = require("../../../shared/errors/apiError");

class MessageService {
  // Get conversations of a user
  async getConversations(userId) {
    const conversations = await MessageRepository.getConversations(userId);
    return conversations;
  }

  // Get conversation between two users
  async getConversation(userId, otherUserId) {
    const conversation = await MessageRepository.getConversation(
      userId,
      otherUserId,
    );
    return conversation;
  }

  async getUnreadConversation(userId) {
    return MessageRepository.getUnreadConversation(userId);
  }

  // Save message to database and emit to the other user
  async sendMessage(senderId, receiverId, content) {
    const message = await MessageRepository.createMessage(
      senderId,
      receiverId,
      content,
    );
    try {
      const io = getIO();
      io.to(receiverId).emit("new_message", message);
    } catch (err) {
      throw new ApiError(500, "Socket emit error:", err.message);
    }

    return message;
  }

  // Set messages as deleted
  async deleteConversation(userId, otherUserId) {
    await MessageRepository.deleteMessage(userId, otherUserId);
  }

  // Set messages as read and emit to the other user
  async markAsRead(userId, otherUserId) {
    await MessageRepository.readMessage(userId, otherUserId);
    try {
      const io = getIO();
      io.to(otherUserId).emit("messages_read", { by: userId });
    } catch (err) {
      throw new ApiError(500, "Socket emit error:", err.message);
    }
  }
}

module.exports = new MessageService();
