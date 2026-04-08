const Message = require("../core/message.model");

const getConversations = async (userId) => {
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ["$senderId", userId] },
            then: "$receiverId",
            else: "$senderId",
          },
        },
        lastMessage: { $first: "$$ROOT" },
      },
    },
    {
      $project: {
        withUser: "$_id",
        lastMessage: 1,
      },
    },
    {
      $sort: { "lastMessage.createdAt": -1 },
    },
  ]);

  return conversations;
};

const getConversation = async (userId, otherUserId) => {
  const conversation = await Message.find({
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  }).sort({ createdAt: 1 });

  return conversation;
};

const createMessage = async (senderId, receiverId, content) => {
  const message = await Message.create({
    senderId,
    receiverId,
    message: content,
  });
  return message;
};

const deleteMessage = async (userId, otherUserId) => {
  await Message.updateMany(
    {
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    { isDeleted: true },
  );
};

const getUnreadConversation = async (userId) => {
  const message = await Message.find({
    receiverId: userId,
    isRead: false,
    isDeleted: false,
  });

  const grouped = message.reduce((acc, msg) => {
    if (!acc[msg.senderId]) {
      acc[msg.senderId] = msg;
    }
    return acc;
  }, {});

  return Object.values(grouped);
};

const readMessage = async (userId, otherUserId) => {
  await Message.updateMany(
    {
      senderId: otherUserId,
      receiverId: userId,
      isRead: false,
    },
    { isRead: true },
  );
};

module.exports = {
  getConversations,
  getConversation,
  createMessage,
  deleteMessage,
  getUnreadConversation,
};
