import { AppError } from '../utils/AppError.js';

const validationOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true
};

export const validate = (schema) => {
  return (req, _res, next) => {
    const data = {
      body: req.body,
      params: req.params,
      query: req.query
    };

    const { value, error } = schema.validate(data, validationOptions);

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return next(new AppError('Validation failed.', 400, errors));
    }

    req.body = value.body;
    req.params = value.params;
    req.query = value.query;

    return next();
  };
};

