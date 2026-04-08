const ContentRepository = require("../infra/content.repository");
const fileService = require("../../../shared/core/file.service");
const ApiError = require("../../../shared/errors/apiError");
const cacheService = require("../../../shared/utils/cache.service");
const companyService = require("../../company/core/company.service");

class ContentService {
  constructor(repository) {
    this.repository = repository;
    this.CACHE_TTL = 3600; // 1 hour
    this.CACHE_KEYS = {
      FEED: "content:feed",
      CONTENT_PREFIX: "content:",
    };
  }

  async _mapContentProfileImages(content) {
    if (!content) return content;
    if (
      content.companyId &&
      content.companyId.pfp &&
      !content.companyId.pfp.startsWith("http")
    ) {
      content.companyId.pfp = await fileService.getFileUrl(
        content.companyId.pfp,
      );
    }
    return content;
  }

  async _mapContentImages(content) {
    if (!content) return content;
    if (content.image && !content.image.startsWith("http")) {
      content.image = await fileService.getFileUrl(content.image);
    }
    return content;
  }

  async createContent(data, userId) {
    data.companyId = userId;
    if (data.image) {
      const uploadedImage = await fileService.uploadFile(
        data.image,
        "contents",
      );
      data.image = uploadedImage.key;
    }

    let content = await this.repository.create(data);
    await this._invalidateCache();
    content = await this._mapContentImages(content);
    content = await this._mapContentProfileImages(content);
    return content;
  }

  async _mapContentWithImageContext(content) {
    if (!content) return content;
    if (content.image && !content.image.startsWith("http")) {
      content.image = await fileService.getFileUrl(content.image);
    }
    return content;
  }

  async _mapContentsListImageRefs(contents) {
    if (contents.length > 0) {
      const enhancedContents = await Promise.all(
        contents.map(async (content) =>
          this._mapContentWithImageContext({
            ...(content.toObject ? content.toObject() : content),
          }),
        ),
      );
      return enhancedContents;
    }
    return contents;
  }

  async _mapContentWithProfileImageContext(content) {
    if (!content) return content;
    if (content.companyId.pfp && !content.companyId.pfp.startsWith("http")) {
      content.companyId.pfp = await fileService.getFileUrl(
        content.companyId.pfp,
      );
    }
    return content;
  }

  async _mapContentsListProfileImageRefs(contents) {
    if (contents.length > 0) {
      const enhancedContents = await Promise.all(
        contents.map(async (content) =>
          this._mapContentProfileImages({
            ...(content.toObject ? content.toObject() : content),
          }),
        ),
      );
      return enhancedContents;
    }
    return contents;
  }

  async getContentByUserId(companyId, options) {
    const contents = await this.repository.find({ companyId }, options);
    const feedWithProfileUrls =
      await this._mapContentsListProfileImageRefs(contents);
    return this._mapContentsListImageRefs(feedWithProfileUrls);
  }

  async updateContent(id, updateData) {
    if (updateData.image) {
      const existingContent = await this.repository.findById(id);
      if (!existingContent) {
        throw new ApiError(404, "Content not found");
      }

      if (existingContent.image && !existingContent.image.startsWith("http")) {
        const uploadedImage = await fileService.updateFile({
          file: updateData.image,
          folder: "contents",
          oldKey: existingContent.image,
        });
        updateData.image = uploadedImage.key;
      } else {
        const uploadedImage = await fileService.uploadFile(
          updateData.image,
          "contents",
        );
        updateData.image = uploadedImage.key;
      }
    }

    let content = await this.repository.update(id, updateData);
    if (!content) {
      throw new ApiError(404, "Content not found");
    }
    await this._invalidateCache(id);
    content = await this._mapContentImages(content);
    content = await this._mapContentProfileImages(content);
    return content;
  }

  async deleteContent(id) {
    const existingContent = await this.repository.findById(id);
    if (!existingContent) {
      throw new ApiError(404, "Content not found");
    }

    const content = await this.repository.delete(id);

    if (existingContent.image && !existingContent.image.startsWith("http")) {
      fileService.deleteFile(existingContent.image).catch(console.error);
    }

    await this._invalidateCache(id);
    return content;
  }

  async likeContent(id, userId) {
    const isLiked = await companyService.likeContent(userId, id);
    const content = await this.repository.incrementLikes(id, isLiked ? -1 : 1);
    if (!content) {
      throw new ApiError(404, "Content not found");
    }
    await cacheService.del(`${this.CACHE_KEYS.CONTENT_PREFIX}${id}`);
    return isLiked ? "Unliked" : "Liked";
  }

  async saveContent(id, userId) {
    const isSaved = await companyService.saveContent(userId, id);
    const content = await this.repository.incrementSaves(id, isSaved ? -1 : 1);
    if (!content) {
      throw new ApiError(404, "Content not found");
    }
    await cacheService.del(`${this.CACHE_KEYS.CONTENT_PREFIX}${id}`);
    return isSaved ? "Unsaved" : "Saved";
  }

  async getFeed(options) {
    const feed = await this.repository.find({ showFeed: true }, options);
    const feedWithUrls = await this._mapContentsListImageRefs(feed);
    const feedWithProfileUrls =
      await this._mapContentsListProfileImageRefs(feedWithUrls);
    return feedWithProfileUrls;
  }

  async _invalidateCache(id = null) {
    await cacheService.invalidatePattern(`${this.CACHE_KEYS.FEED}:*`);
    if (id) {
      await cacheService.del(`${this.CACHE_KEYS.CONTENT_PREFIX}${id}`);
    }
  }
}

module.exports = new ContentService(ContentRepository);
