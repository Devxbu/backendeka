const winston = require("winston");
const { combine, timestamp, json, prettyPrint, errors } = winston.format;
const env = require("../../config/env");

const loggerNames = [
  "general",
  "auth",
  "company",
  "content",
  "message",
  "notification",
  "admin",
  "review",
  "project",
  "tool",
  "faq",
  "category",
  "badge",
];

const createLogger = (name) => {
  return winston.createLogger({
    level: env.LOG_LEVEL,
    defaultMeta: { service: `${name}-service` },
    format: combine(
      errors({ stack: true }),
      timestamp(),
      json(),
      prettyPrint()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: `logs/${name}.log`,
      }),
    ],
  });
};

const loggers = Object.fromEntries(
  loggerNames.map((name) => [`${name}Logger`, createLogger(name)])
);

module.exports = loggers;
