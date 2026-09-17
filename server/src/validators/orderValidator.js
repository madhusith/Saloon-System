import Joi from 'joi';

export const createOrderSchema = Joi.object({
  body: Joi.object({
    pickupDate: Joi.date().required(),
    customerNote: Joi.string().trim().max(500).allow('', null).default(null),
    paymentMethod: Joi.string().valid('ONLINE', 'PAY_AT_SALON').default('PAY_AT_SALON'),
    cardDetails: Joi.object({
      cardNumber: Joi.string().optional(),
      expiryDate: Joi.string().optional(),
      cvv: Joi.string().optional()
    }).optional(),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().min(1).required()
      })
    ).min(1).required()
  }),
  params: Joi.object().empty({}),
  query: Joi.object().empty({})
});

export const updateOrderStatusSchema = Joi.object({
  body: Joi.object({
    orderStatus: Joi.string().valid('PENDING', 'PAID', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED').required(),
    paymentStatus: Joi.string().valid('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED').optional()
  }),
  params: Joi.object({
    id: Joi.number().integer().required()
  }),
  query: Joi.object().empty({})
});
