// server/src/validators/appointmentValidator.js
import Joi from 'joi';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const bookAppointmentSchema = Joi.object({
    body: Joi.object({
        serviceIds: Joi.array().items(Joi.number().integer().positive().required()).min(1).unique().required(),
        staffId: Joi.number().integer().allow(null, 0).default(0), // 0 or null represents "Any Available Stylist"
        appointmentDate: Joi.string().pattern(dateRegex).required().messages({
            'string.pattern.base': 'Appointment date must be in YYYY-MM-DD format.'
        }),
        startTime: Joi.string().pattern(timeRegex).required().messages({
            'string.pattern.base': 'Start time must be in HH:MM or HH:MM:SS format.'
        }),
        notes: Joi.string().trim().allow('', null).default(null)
    }),
    params: Joi.object().empty({}),
    query: Joi.object().empty({})
});

export const getSlotsSchema = Joi.object({
    body: Joi.object().empty({}),
    params: Joi.object().empty({}),
    query: Joi.object({
        serviceIds: Joi.string().required().messages({
            'any.required': 'Service IDs query parameter is required (e.g. ?serviceIds=1,2).'
        }),
        staffId: Joi.number().integer().allow(null, 0).default(0),
        date: Joi.string().pattern(dateRegex).required().messages({
            'string.pattern.base': 'Date must be in YYYY-MM-DD format.'
        })
    })
});

export const appointmentIdParamSchema = Joi.object({
    body: Joi.object().empty({}),
    params: Joi.object({
        id: Joi.number().integer().required()
    }),
    query: Joi.object().empty({})
});

export const listAppointmentsSchema = Joi.object({
    body: Joi.object().empty({}),
    params: Joi.object().empty({}),
    query: Joi.object({
        date: Joi.string().pattern(dateRegex),
        status: Joi.string().valid('PENDING', 'CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'),
        staffId: Joi.number().integer().positive(),
        customerId: Joi.number().integer().positive(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
    })
});
