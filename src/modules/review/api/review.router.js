const express = require("express");
const router = express.Router();

const reviewController = require("./review.controller");
const reviewValidation = require("./review.validation");
const validate = require("../../../shared/middlewares/validate.middleware");

const auth = require("../../../middlewares/auth");

router.use(auth);

router.get("/get-review/:id", validate(reviewValidation.getReview), reviewController.getReview);
router.post("/create-review", validate(reviewValidation.createReview), reviewController.createReview);
router.delete("/delete-review/:id", validate(reviewValidation.getReview), reviewController.deleteReview);
router.patch("/hide-review/:id", validate(reviewValidation.hideReview), reviewController.hideReview);

module.exports = router;
