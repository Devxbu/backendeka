const companyRepository = require("../infra/company.repository");
const cacheService = require("../../../shared/utils/cache.service");
const fileService = require("../../../shared/core/file.service");
const ApiError = require("../../../shared/errors/apiError");

class CompanyService {
  constructor(repository) {
    this.repository = repository;
    this.CACHE_PREFIX = "company:profile:";
    this.CACHE_TTL = 3600; // 1 hour
  }

  async createProfile(authId, companyName) {
    const profile = await this.repository.create({
      authId,
      name: companyName,
      slug: this._generateSlug(companyName),
    });
    return profile;
  }

  async getProfileById(id) {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    let profile = await this.repository.findById(id);

    if (!profile) {
      throw new ApiError(404, "Company profile not found");
    }

    profile = await this._mapProfileImages(profile);

    await cacheService.set(cacheKey, profile, this.CACHE_TTL);
    return profile;
  }

  async getProfileByAuthId(authId, userData = null) {
    const cacheKey = `${this.CACHE_PREFIX}${authId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    let profile = await this.repository.findByAuthId(authId);
    if (!profile) {
      throw new ApiError(404, "Company profile not found");
    }

    await cacheService.set(cacheKey, profile, this.CACHE_TTL);
    return profile;
  }

  async updateProfile(id, data) {
    const currentProfile = await this.repository.findById(id);
    if (!currentProfile) {
      throw new ApiError(404, "Company profile not found");
    }

    if (data.pfp) {
      if (currentProfile.pfp && !currentProfile.pfp.startsWith("http")) {
        const uploadedPfp = await fileService.updateFile({
          file: data.pfp,
          folder: "companies",
          oldKey: currentProfile.pfp,
        });
        data.pfp = uploadedPfp.key;
      } else {
        const uploadedPfp = await fileService.uploadFile(data.pfp, "companies");
        data.pfp = uploadedPfp.key;
      }
    }

    if (data.banner) {
      if (currentProfile.banner && !currentProfile.banner.startsWith("http")) {
        const uploadedBanner = await fileService.updateFile({
          file: data.banner,
          folder: "companies",
          oldKey: currentProfile.banner,
        });
        data.banner = uploadedBanner.key;
      } else {
        const uploadedBanner = await fileService.uploadFile(
          data.banner,
          "companies",
        );
        data.banner = uploadedBanner.key;
      }
    }

    const updated = await this.repository.updateById(id, data);
    if (!updated) {
      throw new ApiError(404, "Company profile not found");
    }

    await this._invalidateCache(id, updated.slug);
    return updated;
  }

  async deleteProfile(id) {
    const profile = await this.repository.findById(id);
    if (profile) {
      await this.repository.deleteById(id);
      if (profile.pfp && !profile.pfp.startsWith("http")) {
        fileService.deleteFile(profile.pfp).catch(console.error);
      }
      if (profile.banner && !profile.banner.startsWith("http")) {
        fileService.deleteFile(profile.banner).catch(console.error);
      }
      await this._invalidateCache(id, profile.slug);
    }
  }

  async saveProfile(id, companyId) {
    const profile = await this.repository.findById(id);
    if (!profile) {
      throw new ApiError(404, "Company profile not found");
    }
    const company = await this.repository.findById(companyId);
    if (!company) {
      throw new ApiError(404, "Company not found");
    }
    profile.savedStudios = profile.savedStudios || [];
    const isSaved = profile.savedStudios.some(
      (studioId) => studioId.toString() === companyId.toString(),
    );

    if (isSaved) {
      profile.savedStudios = profile.savedStudios.filter(
        (studioId) => studioId.toString() !== companyId.toString(),
      );
    } else {
      profile.savedStudios.push(companyId);
    }
    await this.repository.updateById(id, profile);
    await this._invalidateCache(id, profile.slug);
    return profile;
  }

  async likeContent(id, contentId) {
    const profile = await this.repository.findById(id);
    if (!profile) {
      throw new ApiError(404, "Company profile not found");
    }
    profile.likedContents = profile.likedContents || [];
    const isLiked = profile.likedContents.some(
      (contentId) => contentId.toString() === contentId.toString(),
    );
    if (isLiked) {
      profile.likedContents = profile.likedContents.filter(
        (contentId) => contentId.toString() !== contentId.toString(),
      );
    } else {
      profile.likedContents.push(contentId);
    }
    await this.repository.updateById(id, profile);
    await this._invalidateCache(id, profile.slug);
    return isLiked;
  }

  async saveContent(id, contentId) {
    const profile = await this.repository.findById(id);
    if (!profile) {
      throw new ApiError(404, "Company profile not found");
    }
    profile.savedContents = profile.savedContents || [];
    const isSaved = profile.savedContents.some(
      (contentId) => contentId.toString() === contentId.toString(),
    );
    if (isSaved) {
      profile.savedContents = profile.savedContents.filter(
        (contentId) => contentId.toString() !== contentId.toString(),
      );
    } else {
      profile.savedContents.push(contentId);
    }
    await this.repository.updateById(id, profile);
    await this._invalidateCache(id, profile.slug);
    return isSaved;
  }

  async discover(filters, options) {
    const result = await this.repository.discover(filters, options);
    if (result && result.results) {
      result.results = await Promise.all(
        result.results.map(async (profile) =>
          this._mapProfileImages({
            ...(profile.toObject ? profile.toObject() : profile),
          }),
        ),
      );
    }
    return result;
  }

  _generateSlug(name) {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 7)
    );
  }

  async _invalidateCache(id, slug) {
    await Promise.all([
      cacheService.del(`${this.CACHE_PREFIX}${id}`),
      cacheService.del(`${this.CACHE_PREFIX}slug:${slug}`),
    ]);
  }
  async _mapProfileImages(profile) {
    if (!profile) return profile;
    if (profile.pfp && !profile.pfp.startsWith("http")) {
      profile.pfp = await fileService.getFileUrl(profile.pfp);
    }
    if (profile.banner && !profile.banner.startsWith("http")) {
      profile.banner = await fileService.getFileUrl(profile.banner);
    }
    return profile;
  }
}

module.exports = new CompanyService(companyRepository);
