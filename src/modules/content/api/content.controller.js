const ContentService = require("../core/content.service");
const ContentDTO = require("./content.dto");
const catchAsync = require("../../../shared/utils/asyncHandler");

module.exports.createContent = catchAsync(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.image = req.file;
  }
  const content = await ContentService.createContent(data, req.user.userId);
  res.status(201).json(ContentDTO.toResponse(content));
});

module.exports.getContentByUserId = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { limit, page } = req.query;
  const contents = await ContentService.getContentByUserId(userId, {
    limit: parseInt(limit) || 10,
    page: parseInt(page) || 1,
  });
  res.status(200).json(ContentDTO.toFeed(contents));
});

module.exports.updateContent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  if (req.file) {
    updateData.image = req.file;
  }
  const content = await ContentService.updateContent(id, updateData);
  res.status(200).json(ContentDTO.toResponse(content));
});

module.exports.likeContent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const content = await ContentService.likeContent(id, req.user.userId);
  res.status(200).json(ContentDTO.toResponse(content));
});

module.exports.saveContent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const content = await ContentService.saveContent(id, req.user.userId);
  res.status(200).json(ContentDTO.toResponse(content));
});

module.exports.deleteContent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await ContentService.deleteContent(id, req.user.userId);
  res.status(200).json({ message: "Content deleted successfully" });
});

module.exports.getFeed = catchAsync(async (req, res) => {
  const { limit, page, search, category, content_category } = req.query;
  const feed = await ContentService.getFeed(
    {
      limit: parseInt(limit) || 10,
      page: parseInt(page) || 1,
    },
    req.user.userId,
    search,
    category,
    content_category,
  );
  res.status(200).json(ContentDTO.toFeed(feed));
});
