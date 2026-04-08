const express = require("express");
const router = express.Router();

const companyController = require("./company.controller");
const companyValidation = require("./company.validation");
const validate = require("../../../shared/middlewares/validate.middleware");
const multer = require("multer");
const ApiError = require("../../../shared/errors/apiError");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // increased slightly for banners
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new ApiError(400, "Only image files allowed"));
    }
    cb(null, true);
  },
});

const cpUpload = upload.fields([
  { name: "pfp", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

const authMiddleware = require("../../../middlewares/auth");

router.use(authMiddleware);

router.get("/me", companyController.me);
router.get("/discover", validate(companyValidation.discover), companyController.discover);
router.post("/browse", validate(companyValidation.browse), companyController.browse);
router.get("/:id", validate(companyValidation.getProfile), companyController.get);
router.put("/me", cpUpload, validate(companyValidation.updateProfile), companyController.update);
router.delete("/me", companyController.delete);
router.patch("/save/:id", validate(companyValidation.saveProfile), companyController.save);

module.exports = router;
