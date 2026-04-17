const Message = require("../core/message.model");
const mongoose = require("mongoose");

const getConversations = async (userId) => {
  const id = new mongoose.Types.ObjectId(userId);

  const conversations = await Message.aggregate([
    // 1. sadece ilgili mesajlar
    {
      $match: {
        $or: [{ senderId: id }, { receiverId: id }],
        isDeleted: false,
      },
    },

    // 2. conversation partner'ı tek bir alan yap
    {
      $addFields: {
        partnerId: {
          $cond: [{ $eq: ["$senderId", id] }, "$receiverId", "$senderId"],
        },
      },
    },

    // 3. en yeni mesajı en üste al
    { $sort: { createdAt: -1 } },

    // 4. partner bazlı grupla
    {
      $group: {
        _id: "$partnerId",
        lastMessage: { $first: "$$ROOT" },
      },
    },

    // 5. partner bilgisi çek (populate replacement)
    {
      $lookup: {
        from: "companies",
        localField: "_id",
        foreignField: "_id",
        as: "withUser",
      },
    },

    {
      $unwind: "$withUser",
    },

    // 6. clean response
    {
      $project: {
        _id: 0,
        withUser: {
          _id: "$withUser._id",
          name: "$withUser.name",
          pfp: "$withUser.pfp",
        },
        lastMessage: {
          _id: "$lastMessage._id",
          message: "$lastMessage.message",
          createdAt: "$lastMessage.createdAt",
          isRead: "$lastMessage.isRead",
          senderId: "$lastMessage.senderId",
          receiverId: "$lastMessage.receiverId",
        },
      },
    },

    // 7. final sort
    {
      $sort: {
        "lastMessage.createdAt": -1,
      },
    },
  ]);

  return conversations;
};

// const getConversation = async (userId, otherUserId) => {
//   const conversation = await Message.find({
//     $or: [
//       { senderId: userId, receiverId: otherUserId },
//       { senderId: otherUserId, receiverId: userId },
//     ],
//   }).sort({ createdAt: 1 });

//   return conversation;
// };

const getConversation = async (userId, otherUserId) => {
  const conversation = await Message.find({
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  })
    .populate([
      {
        path: "senderId",
        model: "Company",
        select: "_id name pfp",
      },
      {
        path: "receiverId",
        model: "Company",
        select: "_id name pfp",
      },
    ])
    .sort({ createdAt: 1 });

  return conversation;
};

const readConversation = async (userId, otherUserId) => {
  await Message.updateMany(
    {
      senderId: otherUserId,
      receiverId: userId,
      isRead: false,
    },
    { isRead: true },
  );
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
  readConversation,
};
