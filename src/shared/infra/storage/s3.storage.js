const s3Client = require("../../../config/s3.client");
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const env = require("../../../config/env");

class S3Storage {
  async upload({ bucket, key, body, contentType, cacheControl }) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl || "public, max-age=31536000",
    });

    const response = await s3Client.send(command);
    return {
      bucket,
      key,
      etag: response.ETag,
    };
  }

  async delete({ bucket, key }) {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await s3Client.send(command);
  }

  async getUrl(key) {
    const command = new GetObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 60 * 24,
    });
    return url;
  }
}

module.exports = new S3Storage();
