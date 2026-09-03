import 'dotenv/config';

import * as joi from 'joi';

interface EnvVars {
  PORT: number;
}

const envsSchema = joi
  .object<EnvVars>({
    PORT: joi.number().required(),
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
};
