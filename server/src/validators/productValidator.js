import Joi from 'joi';

export const createProductSchema = Joi.object({
    body: Joi.object({
        sku: Joi.string().trim().uppercase().min(3).max(50).required(),
        name: Joi.string().trim().min(2).max(255).required(),
        description: Joi.string().trim().allow('', null).default(null),
        category: Joi.string().valid('HAIR', 'FACE', 'BODY', 'NAILS', 'OTHER').required(),
        costPrice: Joi.number().positive().required(),
        sellingPrice: Joi.number().positive().min(Joi.ref('costPrice')).required().messages({
            'number.min': 'Selling price must be greater than or equal to cost price.'
        }),
        stockQuantity: Joi.number().integer().min(0).default(0),
        reorderLevel: Joi.number().integer().min(0).default(5)
    }),
    params: Joi.object().empty({}),
    query: Joi.object().empty({})
});

export const updateProductSchema = Joi.object({
    body: Joi.object({
        name: Joi.string().trim().min(2).max(255),
        description: Joi.string().trim().allow('', null),
        category: Joi.string().valid('HAIR', 'FACE', 'BODY', 'NAILS', 'OTHER'),
        costPrice: Joi.number().positive(),
        sellingPrice: Joi.number().positive().min(Joi.ref('costPrice')).messages({
            'number.min': 'Selling price must be greater than or equal to cost price.'
        }),
        reorderLevel: Joi.number().integer().min(0),
        status: Joi.string().valid('ACTIVE', 'INACTIVE')
    }),
    params: Joi.object({
        id: Joi.number().integer().required()
    }),
    query: Joi.object().empty({})
});

export const adjustStockSchema = Joi.object({
    body: Joi.object({
        quantityDiff: Joi.number().integer().required().invalid(0), // Can be positive or negative
        movementType: Joi.string().valid('STOCK_PURCHASE', 'DAMAGED_PRODUCT', 'MANUAL_ADJUSTMENT').required(),
        note: Joi.string().trim().max(255).allow('', null).default(null)
    }),
    params: Joi.object({
        id: Joi.number().integer().required()
    }),
    query: Joi.object().empty({})
});
