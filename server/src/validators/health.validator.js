import Joi from 'joi';

export const healthCheckSchema = Joi.object({
  body: Joi.object().empty({}),
  params: Joi.object().empty({}),
  query: Joi.object().empty({})
});

