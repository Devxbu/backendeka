const generalRepository = require("../infra/general.repository");
const faqRepository = require("../infra/faq.repository");
const cacheService = require("../../../shared/utils/cache.service");
const ApiError = require("../../../shared/errors/apiError");
const fileService = require("../../../shared/core/file.service");
const projectService = require("../../project/core/project.service");
const messagesService = require("../../message/core/message.service");

class GeneralService {
  constructor(repository, faqRepository) {
    this.repository = repository;
    this.faqRepository = faqRepository;
    this.CACHE_TTL = 86400; // 24 hours
    this.CACHE_KEYS = {
      ALL_FAQS: "faq:all",
      ALL_TOPICS: "faq:topics",
      FAQ_PREFIX: "faq:",
    };
  }

  // MESSAGES
  async sendMessage(data) {
    return this.repository.createMessage(data);
  }

  async getMessages(options) {
    return this.repository.findMessages({}, options);
  }

  // DASHBOARD (Stats placeholder)
  async getDashboardStats(userId) {
    const projects = await projectService.getProjects(userId, {});
    const unreadMessages = await messagesService.getUnreadConversation(userId);
    return {
      projects: projects.length,
      unreadMessages: unreadMessages.length,
    };
  }

  async getCommunities(options) {
    const communities = await this.repository.findCommunities({}, options);
    return Promise.all(
      communities.map(async (community) => {
        if (community.image && !community.image.startsWith("http")) {
          const url = await fileService.getFileUrl(community.image);
          return {
            ...(community.toObject ? community.toObject() : community),
            image: url,
          };
        }
        return community;
      }),
    );
  }

  async getCommunity(id) {
    const community = await generalRepository.findCommunityById(id);
    if (!community) {
      throw new ApiError(404, "Community item not found");
    }
    if (community.image && !community.image.startsWith("http")) {
      const url = await fileService.getFileUrl(community.image);
      return {
        ...(community.toObject ? community.toObject() : community),
        image: url,
      };
    }
    return community;
  }

  async deleteCommunity(id) {
    const community = await this.repository.findCommunityById(id);
    if (!community) throw new ApiError(404, "Community not found");

    const deleted = await this.repository.deleteCommunity(id);
    if (community.image) {
      fileService.deleteFile(community.image).catch(console.error);
    }
    return deleted;
  }

  async createCommunity(data) {
    if (!data.image) {
      throw new ApiError(400, "Image is required");
    }

    const uploadedImage = await fileService.uploadFile(
      data.image,
      "communities",
    );
    data.image = uploadedImage.key;

    return this.repository.createCommunity(data);
  }

  async getFaqs() {
    const cacheKey = this.CACHE_KEYS.ALL_FAQS;
    const cachedFaqs = await cacheService.get(cacheKey);
    if (cachedFaqs) return cachedFaqs;

    const faqs = await this.faqRepository.findAll();
    if (!faqs) {
      throw new ApiError(404, "Faqs not found");
    }

    await cacheService.set(cacheKey, faqs, this.CACHE_TTL);
    return faqs;
  }

  async getTopics() {
    const cacheKey = this.CACHE_KEYS.ALL_TOPICS;
    const cachedTopics = await cacheService.get(cacheKey);
    if (cachedTopics) return cachedTopics;

    const topics = await this.faqRepository.distinctTopics();
    if (!topics) {
      throw new ApiError(404, "Topics not found");
    }

    await cacheService.set(cacheKey, topics, this.CACHE_TTL);
    return topics;
  }

  async createFaq(question, answer, topic) {
    const faq = await this.faqRepository.create({ question, answer, topic });
    await this._invalidateCache();
    return faq;
  }

  async deleteFaq(id) {
    const faq = await this.faqRepository.delete(id);
    if (!faq) {
      throw new ApiError(404, "Faq not found");
    }
    await this._invalidateCache(id);
    return faq;
  }

  async updateFaq(id, updateData) {
    const faq = await this.faqRepository.update(id, updateData);
    if (!faq) {
      throw new ApiError(404, "Faq not found");
    }
    await this._invalidateCache(id);
    return faq;
  }

  async updateTopic(oldTopic, newTopic) {
    const result = await this.faqRepository.updateTopicName(
      oldTopic,
      newTopic || oldTopic,
    );
    if (result.matchedCount === 0) {
      throw new ApiError(404, "Topic not found");
    }
    await this._invalidateCache();
    return result;
  }

  async deleteTopic(topic) {
    const result = await this.faqRepository.deleteTopic(topic);
    if (result.matchedCount === 0) {
      throw new ApiError(404, "Topic not found");
    }
    await this._invalidateCache();
    return result;
  }

  async _invalidateCache(id = null) {
    await cacheService.del(this.CACHE_KEYS.ALL_FAQS);
    await cacheService.del(this.CACHE_KEYS.ALL_TOPICS);
    if (id) {
      await cacheService.del(`${this.CACHE_KEYS.FAQ_PREFIX}${id}`);
    }
  }
}

module.exports = new GeneralService(generalRepository, faqRepository);
