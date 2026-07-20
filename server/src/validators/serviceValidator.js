import Joi from 'joi';

export const createServiceSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().max(255).required(),
    description: Joi.string().trim().allow('', null).default(null),
    category: Joi.string().valid('HAIR', 'FACE', 'BODY', 'NAILS', 'BRIDAL', 'OTHER').required(),
    durationMinutes: Joi.number().integer().min(1).required(),
    price: Joi.number().min(0).required(),
    imageUrl: Joi.string().trim().allow('', null).default(null),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE')
  }),
  params: Joi.object().empty({}),
  query: Joi.object().empty({})
});

export const updateServiceSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().max(255),
    description: Joi.string().trim().allow('', null),
    category: Joi.string().valid('HAIR', 'FACE', 'BODY', 'NAILS', 'BRIDAL', 'OTHER'),
    durationMinutes: Joi.number().integer().min(1),
    price: Joi.number().min(0),
    imageUrl: Joi.string().trim().allow('', null),
    status: Joi.string().valid('ACTIVE', 'INACTIVE')
  }).min(1),
  params: Joi.object({
    id: Joi.number().integer().required()
  }),
  query: Joi.object().empty({})
});

export const serviceIdParamSchema = Joi.object({
  body: Joi.object().empty({}),
  params: Joi.object({
    id: Joi.number().integer().required()
  }),
  query: Joi.object().empty({})
});

export const listServicesSchema = Joi.object({
  body: Joi.object().empty({}),
  params: Joi.object().empty({}),
  query: Joi.object({
    category: Joi.string().valid('HAIR', 'FACE', 'BODY', 'NAILS', 'BRIDAL', 'OTHER'),
    status: Joi.string().valid('ACTIVE', 'INACTIVE'),
    search: Joi.string().trim().allow(''),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
});

export const assignStaffSchema = Joi.object({
  body: Joi.object({
    staffIds: Joi.array().items(Joi.number().integer().required()).unique().required()
  }),
  params: Joi.object({
    id: Joi.number().integer().required()
  }),
  query: Joi.object().empty({})
});
