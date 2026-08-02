import Joi from 'joi';

export const createOrderSchema = Joi.object({
  body: Joi.object({
    pickupDate: Joi.date().required(),
    customerNote: Joi.string().trim().max(500).allow('', null).default(null),
    paymentMethod: Joi.string().valid('ONLINE').required(),
    cardDetails: Joi.object({
      cardNumber: Joi.string().creditCard().required(),
      expiryDate: Joi.string().pattern(/^(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})$/).required().messages({
        'string.pattern.base': 'Expiry date must be in MM/YY format.'
      }),
      cvv: Joi.string().length(3).pattern(/^[0-9]+$/).required().messages({
        'string.pattern.base': 'CVV must be 3 digits.'
      })
    }).when('paymentMethod', {
      is: 'ONLINE',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
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
