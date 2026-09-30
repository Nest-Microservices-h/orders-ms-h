import 'dotenv/config';

import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  PRODUCTS_MICROSERVICE_HOST: string;
  PRODUCTS_MICROSERVICE_PORT: number;
}

const envsSchema = joi
  .object<EnvVars>({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    PRODUCTS_MICROSERVICE_HOST: joi.string().required(),
    PRODUCTS_MICROSERVICE_PORT: joi.number().required(),
  })
  .unknown(true);

const validationResult = envsSchema.validate(process.env);

if (validationResult.error) {
  throw new Error(
    `Invalid environment variables: ${validationResult.error.message}`,
  );
}

const envVars: EnvVars = validationResult.value;

export const envs = {
  PORT: envVars.PORT,
  DATABASE_URL: envVars.DATABASE_URL,
  PRODUCTS_MICROSERVICE_HOST: envVars.PRODUCTS_MICROSERVICE_HOST,
  PRODUCTS_MICROSERVICE_PORT: envVars.PRODUCTS_MICROSERVICE_PORT,
};
