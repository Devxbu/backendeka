const generalService = require("../core/general.service");
const generalDTO = require("./general.dto");
const catchAsync = require("../../../shared/utils/asyncHandler");

module.exports.sendMessage = catchAsync(async (req, res) => {
  const message = await generalService.sendMessage(req.body);
  res.status(201).json({
    message: "Message sent successfully",
    data: message,
  });
});

module.exports.getDashboard = catchAsync(async (req, res) => {
  const stats = await generalService.getDashboardStats(req.user.userId);
  res.status(200).json(stats);
});

module.exports.getCommunities = catchAsync(async (req, res) => {
  const communities = await generalService.getCommunities();
  res.status(200).json(communities);
});

module.exports.getCommunity = catchAsync(async (req, res) => {
  const { id } = req.params;
  const community = await generalService.getCommunity(id);
  res.status(200).json(community);
});

module.exports.deleteCommunity = catchAsync(async (req, res) => {
  const { id } = req.params;
  await generalService.deleteCommunity(id);
  res.status(200).json({ message: "Community deleted" });
});

module.exports.createCommunity = catchAsync(async (req, res) => {
  const data = {
    ...req.body,
    ...(req.file && { image: req.file }),
  };
  const community = await generalService.createCommunity(data);
  res.status(201).json(community);
});

// FAQ
module.exports.getFaqs = catchAsync(async (req, res) => {
  const faqs = await generalService.getFaqs();
  res.status(200).json(faqs);
});

module.exports.getTopics = catchAsync(async (req, res) => {
  const topics = await generalService.getTopics();
  res.status(200).json(topics);
});

module.exports.createFaq = catchAsync(async (req, res) => {
  const { question, answer, topic } = req.body;
  const faq = await generalService.createFaq(question, answer, topic);
  res.status(201).json(faq);
});

module.exports.deleteFaq = catchAsync(async (req, res) => {
  const { id } = req.params;
  await generalService.deleteFaq(id);
  res.status(200).json({ message: "Faq deleted successfully" });
});

module.exports.deleteTopic = catchAsync(async (req, res) => {
  const { topic } = req.body;
  const result = await generalService.deleteTopic(topic);
  res.status(200).json({
    message: "Topic deleted successfully",
    deletedCount: result.modifiedCount,
  });
});

module.exports.updateFaq = catchAsync(async (req, res) => {
  const { id } = req.params;
  const faq = await generalService.updateFaq(id, req.body);
  res.status(200).json(faq);
});

module.exports.updateTopic = catchAsync(async (req, res) => {
  const { topic, newTopic } = req.body;
  const result = await generalService.updateTopic(topic, newTopic);
  res.status(200).json({
    message: "Topic updated successfully",
    updatedCount: result.modifiedCount,
  });
});
