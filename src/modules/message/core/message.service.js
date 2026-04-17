const MessageRepository = require("../infra/message.repository");
const { getIO } = require("../../../core/socket");
const ApiError = require("../../../shared/errors/apiError");
const fileService = require("../../../shared/core/file.service");
const ProjectService = require("../../project/core/project.service");

class MessageService {
  // Get conversations of a user
  async _mapMessageProfileImages(message) {
    if (!message) return message;
    if (
      message.senderId &&
      message.senderId.pfp &&
      !message.senderId.pfp.startsWith("http")
    ) {
      message.senderId.pfp = await fileService.getFileUrl(message.senderId.pfp);
    }
    if (
      message.receiverId &&
      message.receiverId.pfp &&
      !message.receiverId.pfp.startsWith("http")
    ) {
      message.receiverId.pfp = await fileService.getFileUrl(
        message.receiverId.pfp,
      );
    }
    return message;
  }

  async _mapMessageProfileImage(conversation) {
    if (!conversation) return null;

    const partner = conversation.withUser;

    let updatedPartner = partner;

    if (partner?.pfp && !partner.pfp.startsWith("http")) {
      updatedPartner = {
        ...partner,
        pfp: await fileService.getFileUrl(partner.pfp),
      };
    }

    return {
      ...conversation,
      withUser: updatedPartner,
    };
  }

  async getConversations(userId) {
    const conversations = await MessageRepository.getConversations(userId);
    return Promise.all(
      conversations.map((c) => this._mapMessageProfileImage(c)),
    );
  }
  // Get conversation between two users
  async getConversation(userId, otherUserId) {
    let messages = await MessageRepository.getConversation(userId, otherUserId);

    const pfp = await this._mapMessageProfileImages({
      ...(messages[0].toObject ? messages[0].toObject() : messages[0]),
    });
    delete pfp.message;
    delete pfp.isRead;
    delete pfp.isDeleted;
    delete pfp.createdAt;
    delete pfp.updatedAt;
    delete pfp._id;
    delete pfp.senderId._id;
    delete pfp.receiverId._id;
    delete pfp.__v;
    const projects = await ProjectService.getProjectForMessage(
      userId,
      otherUserId,
    );
    const formattedMessages = messages.map((m) => ({
      ...(m.toObject?.() || m),
      type: "message",
    }));

    const formattedProjects = projects.map((p) => ({
      ...(p.toObject?.() || p),
      type: "project",
    }));

    const merged = [...formattedMessages, ...formattedProjects];

    merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return { conversation: merged, pfp };
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
    await MessageRepository.readConversation(userId, otherUserId);
    try {
      const io = getIO();
      io.to(otherUserId).emit("messages_read", { by: userId });
    } catch (err) {
      throw new ApiError(500, "Socket emit error:", err.message);
    }
  }
}

module.exports = new MessageService();
