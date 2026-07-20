import Joi from 'joi';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

export const updateScheduleSchema = Joi.object({
  body: Joi.object({
    schedule: Joi.array().items(
      Joi.object({
        dayOfWeek: Joi.string().valid('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY').required(),
        isWorking: Joi.boolean().required(),
        startTime: Joi.string().pattern(timeRegex).when('isWorking', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.allow('', null)
        }),
        endTime: Joi.string().pattern(timeRegex).when('isWorking', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.allow('', null)
        })
      })
    ).min(1).required()
  }),
  params: Joi.object({
    id: Joi.number().integer().required()
  }),
  query: Joi.object().empty({})
});

export const addUnavailabilitySchema = Joi.object({
  body: Joi.object({
    unavailabilityType: Joi.string().valid('LEAVE', 'BREAK', 'MEETING', 'PERSONAL', 'BLOCKED').required(),
    startDatetime: Joi.date().iso().required(),
    endDatetime: Joi.date().iso().greater(Joi.ref('startDatetime')).required().messages({
      'date.greater': 'End date and time must be after the start date and time.'
    }),
    description: Joi.string().trim().allow('', null).default(null)
  }),
  params: Joi.object({
    id: Joi.number().integer().required()
  }),
  query: Joi.object().empty({})
});

export const unavailabilityIdParamSchema = Joi.object({
  body: Joi.object().empty({}),
  params: Joi.object({
    id: Joi.number().integer().required(),
    slotId: Joi.number().integer().required()
  }),
  query: Joi.object().empty({})
});

export const staffIdParamSchema = Joi.object({
  body: Joi.object().empty({}),
  params: Joi.object({
    id: Joi.number().integer().required()
  }),
  query: Joi.object().empty({})
});
