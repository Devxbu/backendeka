const express = require("express");
const router = express.Router();

const validate = require("../../../shared/middlewares/validate.middleware");
const contentValidation = require("./content.validation");
const contentController = require("./content.controller");
const authMiddleware = require("../../../middlewares/auth");
const multer = require("multer");
const ApiError = require("../../../shared/errors/apiError");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new ApiError(400, "Only image files allowed"));
    }
    cb(null, true);
  },
});

router.use(authMiddleware);

router.post(
  "/create-content",
  upload.single("image"),
  contentController.createContent,
);
router.get("/get-user-content/:userId", contentController.getContentByUserId);
router.put(
  "/update-content/:id",
  upload.single("image"),
  contentController.updateContent,
);
router.patch("/like-content/:id", contentController.likeContent);
router.patch("/save-content/:id", contentController.saveContent);
router.delete("/delete-content/:id", contentController.deleteContent);
router.get("/feed", contentController.getFeed);

module.exports = router;
