import Joi from 'joi';

export const checkoutSchema = Joi.object({
  body: Joi.object({
    appointmentId: Joi.number().integer().positive().allow(null, 0).default(null),
    customerId: Joi.number().integer().positive().allow(null, 0).default(null),
    subtotal: Joi.number().positive().required(),
    discountAmount: Joi.number().min(0).default(0),
    totalAmount: Joi.number().positive().required(),
    paymentMethod: Joi.string().valid('CASH', 'CARD', 'ONLINE').required(),
    transactionReference: Joi.string().trim().allow('', null).default(null),
    
    items: Joi.array().items(
      Joi.object({
        itemType: Joi.string().valid('PRODUCT', 'SERVICE').required(),
        productId: Joi.number().integer().positive().when('itemType', {
          is: 'PRODUCT',
          then: Joi.required(),
          otherwise: Joi.allow(null, 0)
        }),
        serviceId: Joi.number().integer().positive().when('itemType', {
          is: 'SERVICE',
          then: Joi.required(),
          otherwise: Joi.allow(null, 0)
        }),
        itemNameSnapshot: Joi.string().trim().min(1).required(),
        quantity: Joi.number().integer().positive().required(),
        unitPrice: Joi.number().positive().required(),
        subtotal: Joi.number().positive().required()
      })
    ).min(1).required(),

    adminOverrideEmail: Joi.string().email().trim().allow('', null).default(null),
    adminOverridePassword: Joi.string().allow('', null).default(null)
  }),
  params: Joi.object().empty({}),
  query: Joi.object().empty({})
});
