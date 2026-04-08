const express = require("express");
const router = express.Router();

const projectController = require("./project.controller");
const projectValidation = require("./project.validation");
const validate = require("../../../shared/middlewares/validate.middleware");

const auth = require("../../../middlewares/auth");

router.use(auth);

router.get("/get-projects", validate(projectValidation.getProjects), projectController.getProjects);
router.get("/get-project/:id", validate(projectValidation.getProject), projectController.getProjectById);
router.patch("/snooze-project/:id", validate(projectValidation.snoozeProject), projectController.snoozeProject);
router.patch("/accept-project/:id", validate(projectValidation.getProject), projectController.acceptProject);
router.post("/create-project-request", validate(projectValidation.createProjectRequest), projectController.createProjectRequest);
router.put("/update-project/:id", validate(projectValidation.updateProject), projectController.updateProject);
router.delete("/delete-project/:id", validate(projectValidation.getProject), projectController.deleteProject);

module.exports = router;
