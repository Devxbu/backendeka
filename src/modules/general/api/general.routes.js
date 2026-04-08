const express = require("express");
const router = express.Router();
const multer = require("multer");
const ApiError = require("../../../shared/errors/apiError");

const generalController = require("./general.controller");
const validate = require("../../../shared/middlewares/validate.middleware");
const generalValidation = require("./general.validation");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new ApiError(400, "Only image files allowed"));
    }
    cb(null, true);
  },
});
const auth = require("../../../middlewares/auth");
const authorize = require("../../../middlewares/permission");

// MESSAGES (Public or Auth depending on requirements, usually public for contact form)
router.post("/send-message", validate(generalValidation.sendMessage), generalController.sendMessage);
router.get("/get-communities", auth, generalController.getCommunities);
router.get("/get-community/:id", auth, validate(generalValidation.genericIdParam), generalController.getCommunity);
router.delete(
  "/delete-community/:id",
  auth,
  authorize("admin"),
  validate(generalValidation.genericIdParam),
  generalController.deleteCommunity,
);
router.post(
  "/create-community",
  auth,
  authorize("admin"),
  upload.single("image"),
  validate(generalValidation.createCommunity),
  generalController.createCommunity,
);
router.get("/dashboard", auth, generalController.getDashboard);

router.get("/get-faqs", generalController.getFaqs);
router.get("/get-topics", generalController.getTopics);

// Admin routes
router.post(
  "/create-faq",
  auth,
  authorize("admin"),
  validate(generalValidation.createFaq),
  generalController.createFaq,
);
router.delete(
  "/delete-faq/:id",
  auth,
  authorize("admin"),
  validate(generalValidation.genericIdParam),
  generalController.deleteFaq,
);
router.delete(
  "/delete-topic",
  auth,
  authorize("admin"),
  generalController.deleteTopic,
);
router.put(
  "/update-faq/:id",
  auth,
  authorize("admin"),
  validate(generalValidation.updateFaq),
  generalController.updateFaq,
);
router.patch(
  "/update-topic",
  auth,
  authorize("admin"),
  generalController.updateTopic,
);

module.exports = router;
