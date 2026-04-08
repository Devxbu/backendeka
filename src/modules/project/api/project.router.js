const express = require("express");
const router = express.Router();

const projectController = require("./project.controller");
const projectValidation = require("./project.validation");
const validate = require("../../../shared/middlewares/validate.middleware");

const auth = require("../../../middlewares/auth");

router.use(auth);

router.get("/get-projects", projectController.getProjects);
router.get("/get-project/:id", projectController.getProjectById);
router.patch("/snooze-project/:id", projectController.snoozeProject);
router.patch("/accept-project/:id", projectController.acceptProject);
router.post("/create-project-request", projectController.createProjectRequest);
router.put("/update-project/:id", projectController.updateProject);
router.delete("/delete-project/:id", projectController.deleteProject);

module.exports = router;
