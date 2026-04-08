const express = require("express");
const authRoute = require("../modules/auth/api/auth.routes");
const companyRoute = require("../modules/company/api/company.router");
const projectRoute = require("../modules/project/api/project.router");
const reviewRoute = require("../modules/review/api/review.router");
const contentRoute = require("../modules/content/api/content.router");
const generalRoute = require("../modules/general/api/general.routes");
const notificationRoute = require("../modules/notification/api/notification.routes");
const messageRoute = require("../modules/message/api/message.router");

const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/company",
    route: companyRoute,
  },
  {
    path: "/project",
    route: projectRoute,
  },
  {
    path: "/review",
    route: reviewRoute,
  },
  {
    path: "/content",
    route: contentRoute,
  },
  {
    path: "/general",
    route: generalRoute,
  },
  {
    path: "/notification",
    route: notificationRoute,
  },
  {
    path: "/message",
    route: messageRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
