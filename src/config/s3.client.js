const { S3Client } = require("@aws-sdk/client-s3");
const env = require("./env");

module.exports = new S3Client({
  region: env.BUCKET_REGION,
  credentials: {
    accessKeyId: env.BUCKET_ACCESS_KEY,
    secretAccessKey: env.BUCKET_SECRET_KEY,
  },
});
