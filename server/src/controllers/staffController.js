import { staffRepository } from '../repositories/staffRepository.js';
import { logAudit } from '../services/auditService.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const staffController = {
  /**
   * List all staff members (stylists)
   */
  async listStaff(req, res, next) {
    try {
      const staff = await staffRepository.listAllStaff();
      return sendSuccess(res, {
        message: 'Staff members retrieved successfully.',
        data: { staff }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * List staff members eligible to provide a particular service
   */
  async getEligibleStylists(req, res, next) {
    const { serviceId } = req.params;

    try {
      const stylists = await staffRepository.findEligibleStylists(serviceId);
      return sendSuccess(res, {
        message: 'Eligible stylists retrieved successfully.',
        data: { stylists }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get schedule of a staff member
   */
  async getSchedule(req, res, next) {
    const { id } = req.params;

    try {
      const profile = await staffRepository.findStaffProfile(id);
      if (!profile) {
        return next(new AppError('Staff member not found.', 404));
      }

      const schedule = await staffRepository.getSchedule(id);
      return sendSuccess(res, {
        message: 'Staff schedule retrieved successfully.',
        data: { schedule }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Update schedule of a staff member (Admin or self-update only)
   */
  async updateSchedule(req, res, next) {
    const { id } = req.params;
    const { schedule } = req.body;

    try {
      // Check authorization: ADMIN or self
      if (req.user?.role !== 'ADMIN' && req.user?.id !== Number(id)) {
        return next(new AppError('Unauthorized to update this schedule.', 403));
      }

      const profile = await staffRepository.findStaffProfile(id);
      if (!profile) {
        return next(new AppError('Staff member not found.', 404));
      }

      const oldSchedule = await staffRepository.getSchedule(id);
      await staffRepository.updateSchedule(id, schedule);
      const newSchedule = await staffRepository.getSchedule(id);

      await logAudit({
        userId: req.user?.id,
        action: 'STAFF_SCHEDULE_UPDATED',
        entityType: 'users',
        entityId: id,
        oldValuesJson: oldSchedule,
        newValuesJson: newSchedule,
        ipAddress: req.ip
      });

      return sendSuccess(res, {
        message: 'Staff schedule updated successfully.',
        data: { schedule: newSchedule }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Get unavailability list of a staff member
   */
  async getUnavailability(req, res, next) {
    const { id } = req.params;

    try {
      const profile = await staffRepository.findStaffProfile(id);
      if (!profile) {
        return next(new AppError('Staff member not found.', 404));
      }

      const unavailability = await staffRepository.getUnavailability(id);
      return sendSuccess(res, {
        message: 'Staff unavailability slots retrieved successfully.',
        data: { unavailability }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Block a slot / add unavailability (Admin or self-add only)
   */
  async addUnavailability(req, res, next) {
    const { id } = req.params;
    const data = req.body;

    try {
      // Check authorization: ADMIN or self
      if (req.user?.role !== 'ADMIN' && req.user?.id !== Number(id)) {
        return next(new AppError('Unauthorized to add unavailability for this staff member.', 403));
      }

      const profile = await staffRepository.findStaffProfile(id);
      if (!profile) {
        return next(new AppError('Staff member not found.', 404));
      }

      const newSlot = await staffRepository.addUnavailability(id, data);

      await logAudit({
        userId: req.user?.id,
        action: 'STAFF_UNAVAILABILITY_ADDED',
        entityType: 'users',
        entityId: id,
        newValuesJson: newSlot,
        ipAddress: req.ip
      });

      return sendSuccess(res, {
        statusCode: 201,
        message: 'Staff unavailability slot added successfully.',
        data: { unavailability: newSlot }
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Remove a blocked slot / delete unavailability (Admin or self-delete only)
   */
  async deleteUnavailability(req, res, next) {
    const { id, slotId } = req.params;

    try {
      // Check authorization: ADMIN or self
      if (req.user?.role !== 'ADMIN' && req.user?.id !== Number(id)) {
        return next(new AppError('Unauthorized to delete unavailability for this staff member.', 403));
      }

      const profile = await staffRepository.findStaffProfile(id);
      if (!profile) {
        return next(new AppError('Staff member not found.', 404));
      }

      const deleted = await staffRepository.deleteUnavailability(id, slotId);
      if (!deleted) {
        return next(new AppError('Unavailability slot not found or not owned by this staff.', 404));
      }

      await logAudit({
        userId: req.user?.id,
        action: 'STAFF_UNAVAILABILITY_DELETED',
        entityType: 'users',
        entityId: id,
        oldValuesJson: { slotId },
        ipAddress: req.ip
      });

      return sendSuccess(res, {
        message: 'Staff unavailability slot removed successfully.'
      });
    } catch (error) {
      return next(error);
    }
  }
};
