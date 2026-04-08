const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const loggers = require("../shared/utils/logger");
const accessTokenRedis = require("../utils/accessTokenRedis");

let io;

// socket sunucusunu başlatıp ayarları yapıyoruz
const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // token kontrolü yapıyoruz güvenli bağlantı şart
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: Missing token"));
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await accessTokenRedis.getAccessToken(decoded.tokenId);

      if (!user) {
        return next(new Error("Authentication error: Session expired"));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    loggers.generalLogger.info(
      `User connected to socket: ${socket.user.userId}`,
    );

    // kullanıcı bağlandığında kendi ıdsiyle bir odaya katıyoruz
    const userId = socket.user.userId;
    if (userId) {
      socket.join(userId.toString());
    }

    socket.on("disconnect", () => {
      loggers.generalLogger.info("User disconnected from socket");
    });
  });

  return io;
};

// başlatılmış socket instanceını diğer dosyalarda kulanmak için
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initializeSocket, getIO };
