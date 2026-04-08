const redisClient = require("../config/redis");

module.exports.getAccessToken = async (tokenId) => {
  try {
    const data = await redisClient.get(`auth:access:${tokenId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};
