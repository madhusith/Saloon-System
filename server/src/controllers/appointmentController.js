// server/src/controllers/appointmentController.js
import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { serviceRepository } from '../repositories/serviceRepository.js';
import { staffRepository } from '../repositories/staffRepository.js';
import { calculateAvailableSlots, parseTimeToMinutes, minutesToTimeStr } from '../utils/slotCalculator.js';
import { emailService } from '../services/emailService.js';
import { logAudit } from '../services/auditService.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const appointmentController = {
    /**
     * Get available start time slots for a specific date and service list
     */
    async getAvailableSlots(req, res, next) {
        const { serviceIds, staffId, date } = req.query;

        try {
            const sIds = serviceIds.split(',').map(Number);
            const services = await Promise.all(sIds.map((id) => serviceRepository.findById(id)));

            if (services.some((s) => !s || s.status !== 'ACTIVE')) {
                return next(new AppError('One or more selected services are invalid or inactive.', 400));
            }

            const totalDuration = services.reduce((sum, s) => sum + s.duration_minutes, 0);
            const targetDayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

            const staffIdNum = Number(staffId || 0);

            if (staffIdNum > 0) {
                // Retrieve slots for a specific stylist
                const profile = await staffRepository.findStaffProfile(staffIdNum);
                if (!profile || profile.status !== 'ACTIVE') {
                    return next(new AppError('Selected stylist profile is invalid or inactive.', 400));
                }

                // Verify stylist offers all selected services
                const assignedServices = await serviceRepository.getAssignedStaffIds(staffIdNum); // wait, getAssignedStaffIds returns staff assigned to a service.
                // Let's get services offered by this staff member:
                const offeredServices = await Promise.all(sIds.map(async (sid) => {
                    const sids = await serviceRepository.getAssignedStaffIds(sid);
                    return sids.includes(staffIdNum);
                }));

                if (offeredServices.some((offered) => !offered)) {
                    return sendSuccess(res, { message: 'Stylist does not offer all selected services.', data: { slots: [] } });
                }

                const [schedule] = await staffRepository.getSchedule(staffIdNum);
                const daySchedule = (await staffRepository.getSchedule(staffIdNum)).find((s) => s.day_of_week === targetDayOfWeek);
                const unavailability = await staffRepository.getUnavailability(staffIdNum);
                const appointments = await appointmentRepository.getAppointmentsForStylist(staffIdNum, date);

                const slots = calculateAvailableSlots({
                    workingHours: daySchedule,
                    unavailability,
                    appointments,
                    dateStr: date,
                    durationMinutes: totalDuration
                });

                return sendSuccess(res, {
                    message: 'Slots retrieved successfully.',
                    data: { slots }
                });
            } else {
                // "Any Available Stylist" - Aggregate slots from all eligible stylists
                const allStylists = await staffRepository.listAllStaff();
                const activeStylists = allStylists.filter((s) => s.status === 'ACTIVE');

                const slotSets = await Promise.all(activeStylists.map(async (stylist) => {
                    // Check if stylist offers all selected services
                    const offeredServices = await Promise.all(sIds.map(async (sid) => {
                        const sids = await serviceRepository.getAssignedStaffIds(sid);
                        return sids.includes(stylist.id);
                    }));

                    if (offeredServices.some((offered) => !offered)) {
                        return [];
                    }

                    const daySchedule = (await staffRepository.getSchedule(stylist.id)).find((s) => s.day_of_week === targetDayOfWeek);
                    const unavailability = await staffRepository.getUnavailability(stylist.id);
                    const appointments = await appointmentRepository.getAppointmentsForStylist(stylist.id, date);

                    return calculateAvailableSlots({
                        workingHours: daySchedule,
                        unavailability,
                        appointments,
                        dateStr: date,
                        durationMinutes: totalDuration
                    });
                }));

                // Flatten and unique union
                const unionSlots = Array.from(new Set(slotSets.flat())).sort((a, b) => {
                    return parseTimeToMinutes(a) - parseTimeToMinutes(b);
                });

                return sendSuccess(res, {
                    message: 'Aggregated slots retrieved successfully.',
                    data: { slots: unionSlots }
                });
            }
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Book a new appointment
     */
    async createAppointment(req, res, next) {
        const { serviceIds, staffId, appointmentDate, startTime, notes } = req.body;

        // Default to logged-in user if they are a Customer
        const customerId = req.user.id;

        try {
            const services = await Promise.all(serviceIds.map((id) => serviceRepository.findById(id)));
            if (services.some((s) => !s || s.status !== 'ACTIVE')) {
                return next(new AppError('One or more selected services are invalid.', 400));
            }

            const totalDuration = services.reduce((sum, s) => sum + s.duration_minutes, 0);
            const totalPrice = services.reduce((sum, s) => sum + Number(s.price), 0);

            // Calculate end time
            const startMin = parseTimeToMinutes(startTime);
            const endMin = startMin + totalDuration;
            const endTime = minutesToTimeStr(endMin) + ':00';
            const formattedStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;

            let chosenStaffId = Number(staffId || 0);

            const targetDayOfWeek = new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

            if (chosenStaffId > 0) {
                // 1. Specific stylist validation
                const offeredServices = await Promise.all(serviceIds.map(async (sid) => {
                    const sids = await serviceRepository.getAssignedStaffIds(sid);
                    return sids.includes(chosenStaffId);
                }));

                if (offeredServices.some((offered) => !offered)) {
                    return next(new AppError('Selected stylist does not provide all the chosen services.', 400));
                }

                const daySchedule = (await staffRepository.getSchedule(chosenStaffId)).find((s) => s.day_of_week === targetDayOfWeek);
                if (!daySchedule || !daySchedule.is_working) {
                    return next(new AppError('Selected stylist does not work on this weekday.', 400));
                }

                // Verify within working shift hours
                const shiftStart = parseTimeToMinutes(daySchedule.start_time);
                const shiftEnd = parseTimeToMinutes(daySchedule.end_time);
                if (startMin < shiftStart || endMin > shiftEnd) {
                    return next(new AppError('Selected time slot falls outside stylist shift hours.', 400));
                }

                // Double-booking check
                const hasOverlap = await appointmentRepository.checkTimeOverlap(chosenStaffId, appointmentDate, formattedStartTime, endTime);
                if (hasOverlap) {
                    return next(new AppError('The selected time slot is already booked for this stylist.', 400));
                }
            } else {
                // 2. "Any Available Stylist" assignment logic
                const allStylists = await staffRepository.listAllStaff();
                const activeStylists = allStylists.filter((s) => s.status === 'ACTIVE');

                let availableStylistId = null;

                for (const stylist of activeStylists) {
                    // Check service fit
                    const offeredServices = await Promise.all(serviceIds.map(async (sid) => {
                        const sids = await serviceRepository.getAssignedStaffIds(sid);
                        return sids.includes(stylist.id);
                    }));

                    if (offeredServices.some((offered) => !offered)) continue;

                    // Check schedule
                    const daySchedule = (await staffRepository.getSchedule(stylist.id)).find((s) => s.day_of_week === targetDayOfWeek);
                    if (!daySchedule || !daySchedule.is_working) continue;

                    const shiftStart = parseTimeToMinutes(daySchedule.start_time);
                    const shiftEnd = parseTimeToMinutes(daySchedule.end_time);
                    if (startMin < shiftStart || endMin > shiftEnd) continue;

                    // Check double-booking overlap
                    const hasOverlap = await appointmentRepository.checkTimeOverlap(stylist.id, appointmentDate, formattedStartTime, endTime);
                    if (hasOverlap) continue;

                    // Stylist is free, assign it
                    availableStylistId = stylist.id;
                    break;
                }

                if (!availableStylistId) {
                    return next(new AppError('No stylist is available for the selected services at this time slot.', 400));
                }

                chosenStaffId = availableStylistId;
            }

            // Generate unique booking reference: SAL-YYYYMMDD-[HEX]
            const hexRandom = Math.random().toString(16).substring(2, 6).toUpperCase();
            const dateNoDash = appointmentDate.replace(/-/g, '');
            const bookingReference = `SAL-${dateNoDash}-${hexRandom}`;

            const newAppt = await appointmentRepository.create({
                customerId,
                staffId: chosenStaffId,
                bookingReference,
                appointmentDate,
                startTime: formattedStartTime,
                endTime,
                totalDurationMinutes: totalDuration,
                totalPrice,
                notes,
                serviceIds
            });

            await logAudit({
                userId: req.user?.id,
                action: 'APPOINTMENT_BOOKED',
                entityType: 'appointments',
                entityId: newAppt.id,
                newValuesJson: newAppt,
                ipAddress: req.ip
            });

            return sendSuccess(res, {
                statusCode: 201,
                message: 'Appointment booked successfully.',
                data: { appointment: newAppt }
            });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Cancel an appointment (Customers can cancel > 24 hours in advance)
     */
    async cancelAppointment(req, res, next) {
        const { id } = req.params;

        try {
            const appt = await appointmentRepository.findById(id);
            if (!appt) {
                return next(new AppError('Appointment not found.', 404));
            }

            // Authorization checks
            if (req.user?.role === 'CUSTOMER' && appt.customer_id !== req.user?.id) {
                return next(new AppError('Unauthorized to cancel this appointment.', 403));
            }

            // Customer > 24 hour restriction check
            if (req.user?.role === 'CUSTOMER') {
                const apptDatetime = new Date(`${appt.appointment_date}T${appt.start_time}`);
                const hoursDiff = (apptDatetime - new Date()) / (1000 * 60 * 60);

                if (hoursDiff < 24) {
                    return next(new AppError('Appointments can only be cancelled at least 24 hours in advance.', 400));
                }
            }

            await appointmentRepository.updateStatus(id, 'CANCELLED');

            await logAudit({
                userId: req.user?.id,
                action: 'APPOINTMENT_CANCELLED',
                entityType: 'appointments',
                entityId: id,
                oldValuesJson: { status: appt.status },
                newValuesJson: { status: 'CANCELLED' },
                ipAddress: req.ip
            });

            return sendSuccess(res, {
                message: 'Appointment cancelled successfully.'
            });
        } catch (error) {
            return next(error);
        }
    },

    /**
 * Update appointment status (Admin / Cashier / Staff)
 */
    async updateAppointmentStatus(req, res, next) {
        const { id } = req.params;
        const { status } = req.body;

        try {
            const appt = await appointmentRepository.findById(id);
            if (!appt) {
                return next(new AppError('Appointment not found.', 404));
            }

            await appointmentRepository.updateStatus(id, status);

            await logAudit({
                userId: req.user?.id,
                action: 'APPOINTMENT_STATUS_UPDATED',
                entityType: 'appointments',
                entityId: id,
                oldValuesJson: { status: appt.status },
                newValuesJson: { status },
                ipAddress: req.ip
            });

            return sendSuccess(res, {
                message: `Appointment status updated to ${status} successfully.`
            });
        } catch (error) {
            return next(error);
        }
    },


    /**
     * List all appointments with pagination and filters
     */
    async listAppointments(req, res, next) {
        const { date, status, staffId, customerId, page = 1, limit = 10 } = req.query;

        try {
            // Customers should only view their own bookings
            let filterCustomerId = customerId;
            if (req.user?.role === 'CUSTOMER') {
                filterCustomerId = req.user?.id;
            }

            const offset = (Number(page) - 1) * Number(limit);
            const { appointments, total } = await appointmentRepository.listAll({
                date,
                status,
                staffId,
                customerId: filterCustomerId,
                limit,
                offset
            });

            return sendSuccess(res, {
                message: 'Appointments retrieved successfully.',
                data: {
                    appointments,
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
    }


};
