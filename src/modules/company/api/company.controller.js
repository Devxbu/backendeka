const companyService = require("../core/company.service");
const companyDTO = require("./company.dto");
const catchAsync = require("../../../shared/utils/asyncHandler");

module.exports.me = catchAsync(async (req, res) => {
  // Use user session data to get or initialize profile
  const profile = await companyService.getProfileById(
    req.user.userId,
    req.user,
  );
  //   res.status(200).json(companyDTO.toPrivateResponse(profile));
  res.status(200).json(companyDTO.toPublicResponse(profile));
});

module.exports.get = catchAsync(async (req, res) => {
  const profile = await companyService.getProfileById(req.params.id);
  res.status(200).json(companyDTO.toPublicResponse(profile));
});

module.exports.update = catchAsync(async (req, res) => {
  const updateData = { ...req.body };
  if (req.files) {
    if (req.files.pfp) {
      updateData.pfp = req.files.pfp[0];
    }
    if (req.files.banner) {
      updateData.banner = req.files.banner[0];
    }
  }
  const updated = await companyService.updateProfile(
    req.user.userId,
    updateData,
  );
  res.status(200).json(companyDTO.toPublicResponse(updated));
});

module.exports.save = catchAsync(async (req, res) => {
  const updated = await companyService.saveProfile(
    req.user.userId,
    req.params.id,
  );
  res.status(200).json(companyDTO.toPublicResponse(updated));
});

module.exports.discover = catchAsync(async (req, res) => {
  const { limit, page, ...filters } = req.query;
  const result = await companyService.discover(filters, {
    limit: parseInt(limit) || 20,
    page: parseInt(page) || 1,
  });

  res.status(200).json({
    ...result,
    results: companyDTO.toList(result.results),
  });
});

module.exports.browse = catchAsync(async (req, res) => {
  const { limit, page, search, ...filters } = req.body;

  if (search) {
    filters.$text = { $search: search };
  }

  const result = await companyService.discover(filters, {
    limit: parseInt(limit) || 20,
    page: parseInt(page) || 1,
  });

  res.status(200).json({
    ...result,
    results: companyDTO.toList(result.results),
  });
});

module.exports.delete = catchAsync(async (req, res) => {
  await companyService.deleteProfile(req.user.userId);
  res.status(204).send();
});
