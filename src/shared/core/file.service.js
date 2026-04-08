const s3Storage = require("../infra/storage/s3.storage");
const crypto = require("crypto");
const env = require("../../config/env");

class FileService {
  async uploadFile(file, folder, cacheControl) {
    return s3Storage.upload({
      bucket: env.BUCKET_NAME,
      key: `${folder}/${crypto.randomUUID()}`,
      body: file.buffer,
      contentType: file.mimetype,
      cacheControl: cacheControl,
    });
  }

  async updateFile({ file, oldKey, folder, cacheControl }) {
    const uploaded = await this.uploadFile(file, folder, cacheControl);
    if (oldKey) {
      await this.deleteFile(oldKey);
    }
    return uploaded;
  }

  async deleteFile(key) {
    return s3Storage.delete({
      bucket: env.BUCKET_NAME,
      key,
    });
  }

  async getFileUrl(key) {
    return s3Storage.getUrl(key);
  }
}

module.exports = new FileService();
