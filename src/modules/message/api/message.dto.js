class MessageDTO {
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

  static toResponse(conversation) {
    if (!conversation) return null;

    return {
      partner: conversation.withUser
        ? {
            id: conversation.withUser._id,
            name: conversation.withUser.name,
            pfp: conversation.withUser.pfp,
          }
        : null,

      lastMessage: conversation.lastMessage
        ? {
            id: conversation.lastMessage._id,
            senderId: conversation.lastMessage.senderId,
            receiverId: conversation.lastMessage.receiverId,
            message: conversation.lastMessage.message,
            isRead: conversation.lastMessage.isRead,
            createdAt: conversation.lastMessage.createdAt,
          }
        : null,
    };
  }

  static toMessageList(conversations) {
    if (!conversations) return [];
    return conversations.map((c) => this.toResponse(c));
  }

  static toItem(item) {
    if (!item) return null;

    // MESSAGE
    if (item.type === "message") {
      return {
        id: item._id || item.id,
        type: "message",
        senderId: item.senderId,
        receiverId: item.receiverId,
        message: item.message,
        isRead: item.isRead,
        createdAt: item.createdAt,
      };
    }

    // PROJECT
    if (item.type === "project") {
      return {
        id: item._id || item.id,
        name: item.name,
        description: item.description,
        categories: item.categories,
        budget: item.budget,
        language: item.language,
        tools: item.tools,
        startDate: item.startDate,
        endDate: item.endDate,
        progress: item.progress,
        isApproved: item.isApproved,
        finalPrice: item.finalPrice,
        approvedDate: item.approvedDate,
        snoozedEndDate: item.snoozedEndDate,
        incoming: item.incoming,
        createdAt: item.createdAt,
        type: "project",
        userId: item.userId,
        partnerId: item.partnerId,
      };
    }

    return null;
  }

  static toList(items) {
    if (!items) return [];
    return items.map((item) => this.toItem(item));
  }
}

module.exports = MessageDTO;
