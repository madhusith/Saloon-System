import { serviceRepository } from '../repositories/serviceRepository.js';
import { logAudit } from '../services/auditService.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const serviceController = {
  /**
   * List all services with filters and pagination
   */
  async listServices(req, res, next) {
    const { category, status, search, page = 1, limit = 10 } = req.query;

    try {
      const offset = (Number(page) - 1) * Number(limit);
      const { services, total } = await serviceRepository.listAll({
        category,
        status,
        search,
        limit,
        offset
      });

      return sendSuccess(res, {
        message: 'Services retrieved successfully.',
        data: {
          services,
          meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get a single service with its assigned staff
   */
  async getService(req, res, next) {
    const { id } = req.params;

    try {
      const service = await serviceRepository.findById(id);
      if (!service) {
        return next(new AppError('Service not found.', 404));
      }

      const assignedStaffIds = await serviceRepository.getAssignedStaffIds(id);

      return sendSuccess(res, {
        message: 'Service retrieved successfully.',
        data: {
          service,
          assignedStaffIds
        }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Create a new service
   */
  async createService(req, res, next) {
    const { name, description, category, durationMinutes, price, imageUrl, status } = req.body;

    try {
      const existing = await serviceRepository.findByName(name);
      if (existing) {
        return next(new AppError('A service with this name already exists.', 400));
      }

      const newService = await serviceRepository.create({
        name,
        description,
        category,
        durationMinutes,
        price,
        imageUrl,
        status
      });

      await logAudit({
        userId: req.user?.id,
        action: 'SERVICE_CREATED',
        entityType: 'services',
        entityId: newService.id,
        newValuesJson: newService,
        ipAddress: req.ip
      });

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Service created successfully.',
        data: { service: newService }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Update an existing service
   */
  async updateService(req, res, next) {
    const { id } = req.params;
    const updates = req.body;

    try {
      const service = await serviceRepository.findById(id);
      if (!service) {
        return next(new AppError('Service not found.', 404));
      }

      if (updates.name && updates.name !== service.name) {
        const existing = await serviceRepository.findByName(updates.name);
        if (existing) {
          return next(new AppError('A service with this name already exists.', 400));
        }
      }

      await serviceRepository.update(id, updates);
      const updatedService = await serviceRepository.findById(id);

      await logAudit({
        userId: req.user?.id,
        action: 'SERVICE_UPDATED',
        entityType: 'services',
        entityId: id,
        oldValuesJson: service,
        newValuesJson: updatedService,
        ipAddress: req.ip
      });

      return sendSuccess(res, {
        message: 'Service updated successfully.',
        data: { service: updatedService }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Soft delete a service
   */
  async deleteService(req, res, next) {
    const { id } = req.params;

    try {
      const service = await serviceRepository.findById(id);
      if (!service) {
        return next(new AppError('Service not found.', 404));
      }

      await serviceRepository.delete(id);

      await logAudit({
        userId: req.user?.id,
        action: 'SERVICE_DELETED',
        entityType: 'services',
        entityId: id,
        oldValuesJson: service,
        ipAddress: req.ip
      });

      return sendSuccess(res, {
        message: 'Service deleted successfully.'
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Assign staff to a service
   */
  async assignStaff(req, res, next) {
    const { id } = req.params;
    const { staffIds } = req.body;

    try {
      const service = await serviceRepository.findById(id);
      if (!service) {
        return next(new AppError('Service not found.', 404));
      }

      const oldStaffIds = await serviceRepository.getAssignedStaffIds(id);
      await serviceRepository.assignStaff(id, staffIds);

      await logAudit({
        userId: req.user?.id,
        action: 'SERVICE_STAFF_ASSIGNED',
        entityType: 'services',
        entityId: id,
        oldValuesJson: { staffIds: oldStaffIds },
        newValuesJson: { staffIds },
        ipAddress: req.ip
      });

      return sendSuccess(res, {
        message: 'Staff assigned to service successfully.',
        data: { staffIds }
      });
    } catch (error) {
      return next(error);
    }
  }
};
