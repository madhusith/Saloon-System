import Joi from 'joi';

export const createUserSchema = Joi.object({
  body: Joi.object({
    fullName: Joi.string().trim().max(100).required(),
    email: Joi.string().trim().email({ tlds: false }).lowercase().required(),
    phone: Joi.string().trim().allow('', null).default(null),
    role: Joi.string().valid('CUSTOMER', 'STAFF', 'CASHIER', 'ADMIN').required(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').default('ACTIVE'),
    // Profile updates
    specialization: Joi.string().trim().allow('', null).default(null),
    experienceYears: Joi.number().integer().min(0).default(0),
    bio: Joi.string().trim().allow('', null).default(null),
    address: Joi.string().trim().allow('', null).default(null),
    notes: Joi.string().trim().allow('', null).default(null)
  }),
  params: Joi.object().empty({}),
  query: Joi.object().empty({})
});

export const updateUserSchema = Joi.object({
  body: Joi.object({
    fullName: Joi.string().trim().max(100),
    email: Joi.string().trim().email({ tlds: false }).lowercase(),
    phone: Joi.string().trim().allow('', null),
    // Profile updates
    specialization: Joi.string().trim().allow('', null),
    experienceYears: Joi.number().integer().min(0),
    bio: Joi.string().trim().allow('', null),
    address: Joi.string().trim().allow('', null),
    notes: Joi.string().trim().allow('', null)
  }).min(1),
  params: Joi.object({
    id: Joi.number().integer().required()
  }),
  query: Joi.object().empty({})
});

export const updateStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').required()
  }),
  params: Joi.object({
    id: Joi.number().integer().required()
  }),
  query: Joi.object().empty({})
});

export const userIdParamSchema = Joi.object({
  body: Joi.object().empty({}),
  params: Joi.object({
    id: Joi.number().integer().required()
  }),
  query: Joi.object().empty({})
});

export const listUsersSchema = Joi.object({
  body: Joi.object().empty({}),
  params: Joi.object().empty({}),
  query: Joi.object({
    role: Joi.string().valid('CUSTOMER', 'STAFF', 'CASHIER', 'ADMIN'),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED'),
    search: Joi.string().trim().allow(''),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
});
