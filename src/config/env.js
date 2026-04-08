const dotenv = require("dotenv").config();
const Joi = require("joi");

const envSchema = Joi.object({
  PORT: Joi.number().default(8000),
  MONGODB_URI: Joi.string().required().description("MongoDB Connection URL"),
  REDIS_HOST: Joi.string().default("127.0.0.1"),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow(null, "").default(null),
  REDIS_DB: Joi.number().default(0),
  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "http", "verbose", "debug", "silly")
    .default("info"),
  NODE_ENV: Joi.string()
    .valid("production", "development", "test")
    .default("development"),
  REDIS_URL: Joi.string().optional(),
  EMAIL_USER: Joi.string().optional(),
  EMAIL_PASS: Joi.string().optional(),
  FRONTEND_URL: Joi.string().uri().optional(),
  FRONTEND_EMAIL_VERIFICATION_URL: Joi.string().uri().optional(),
  FRONTEND_PASSWORD_RESET_URL: Joi.string().uri().optional(),
  JWT_SECRET: Joi.string().required().description("JWT Secret Key"),
  BUCKET_NAME: Joi.string().required().description("Bucket Name"),
  BUCKET_REGION: Joi.string().required().description("Bucket Region"),
  BUCKET_ACCESS_KEY: Joi.string().required().description("Bucket Access Key"),
  BUCKET_SECRET_KEY: Joi.string().required().description("Bucket Secret Key"),
}).unknown();

const { value: envVars, error } = envSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  PORT: envVars.PORT,
  MONGODB_URI: envVars.MONGODB_URI,
  REDIS_HOST: envVars.REDIS_HOST,
  REDIS_PORT: envVars.REDIS_PORT,
  REDIS_PASSWORD: envVars.REDIS_PASSWORD,
  REDIS_DB: envVars.REDIS_DB,
  LOG_LEVEL: envVars.LOG_LEVEL,
  NODE_ENV: envVars.NODE_ENV,
  REDIS_URL: envVars.REDIS_URL,
  REDIS_HOST: envVars.REDIS_HOST,
  REDIS_PORT: envVars.REDIS_PORT,
  REDIS_PASSWORD: envVars.REDIS_PASSWORD,
  EMAIL_USER: envVars.EMAIL_USER,
  EMAIL_PASS: envVars.EMAIL_PASS,
  FRONTEND_URL: envVars.FRONTEND_URL,
  FRONTEND_EMAIL_VERIFICATION_URL: envVars.FRONTEND_EMAIL_VERIFICATION_URL,
  FRONTEND_PASSWORD_RESET_URL: envVars.FRONTEND_PASSWORD_RESET_URL,
  JWT_SECRET: envVars.JWT_SECRET,
  BUCKET_NAME: envVars.BUCKET_NAME,
  BUCKET_REGION: envVars.BUCKET_REGION,
  BUCKET_ACCESS_KEY: envVars.BUCKET_ACCESS_KEY,
  BUCKET_SECRET_KEY: envVars.BUCKET_SECRET_KEY,
};
