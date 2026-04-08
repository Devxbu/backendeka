class MessageDTO {
  static toResponse(message) {
    if (!message) return null;
    return {
      id: message._id || message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      message: message.message,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };
  }

  static toConversationItem(convo) {
    if (!convo) return null;
    return {
      id: convo._id || convo.id,
      partnerId: convo.partnerId,
      lastMessage: convo.lastMessage,
      unreadCount: convo.unreadCount,
      updatedAt: convo.updatedAt,
    };
  }

  static toMessageList(messages) {
    if (!messages) return [];
    return messages.map(msg => this.toResponse(msg));
  }
}

module.exports = MessageDTO;
