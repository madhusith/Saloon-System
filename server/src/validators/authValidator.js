import Joi from 'joi';

export const registerSchema = Joi.object({
  body: Joi.object({
    fullName: Joi.string().trim().max(100).required(),
    email: Joi.string().trim().email({ tlds: false }).lowercase().required(),
    phone: Joi.string().trim().allow('', null).default(null),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
      'any.only': 'Confirm password must match password.'
    })
  }),
  params: Joi.object().empty({}),
  query: Joi.object().empty({})
});

export const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().email({ tlds: false }).lowercase().required(),
    password: Joi.string().required()
  }),
  params: Joi.object().empty({}),
  query: Joi.object().empty({})
});

export const forgotPasswordSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().email({ tlds: false }).lowercase().required()
  }),
  params: Joi.object().empty({}),
  query: Joi.object().empty({})
});

export const resetPasswordSchema = Joi.object({
  body: Joi.object({
    token: Joi.string().required(),
    email: Joi.string().trim().email({ tlds: false }).lowercase().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
      'any.only': 'Confirm password must match password.'
    })
  }),
  params: Joi.object().empty({}),
  query: Joi.object().empty({})
});

export const changePasswordSchema = Joi.object({
  body: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
    confirmNewPassword: Joi.string().required().valid(Joi.ref('newPassword')).messages({
      'any.only': 'Confirm new password must match new password.'
    })
  }),
  params: Joi.object().empty({}),
  query: Joi.object().empty({})
});
