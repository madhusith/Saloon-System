// server/src/utils/slotCalculator.js

/**
 * Parses time string (HH:MM:SS or HH:MM) into minutes since midnight
 * @param {String} timeStr 
 * @returns {Number}
 */
export const parseTimeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Converts minutes since midnight back to a time string (HH:MM)
 * @param {Number} minutes 
 * @returns {String}
 */
export const minutesToTimeStr = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Calculates available starting time slots (at 30-minute intervals) for a stylist on a specific date.
 * 
 * @param {Object} options
 * @param {Object|null} options.workingHours - Stylist schedule for the day (from staff_schedules)
 * @param {Array} options.unavailability - List of stylist unavailability blocks (from staff_unavailability)
 * @param {Array} options.appointments - List of existing active appointments for the stylist on that day
 * @param {String} options.dateStr - Target date string (YYYY-MM-DD)
 * @param {Number} options.durationMinutes - Total duration of selected service(s)
 * @returns {Array<String>} Array of starting time strings (e.g. ["09:00", "09:30"])
 */
export const calculateAvailableSlots = ({
    workingHours,
    unavailability = [],
    appointments = [],
    dateStr,
    durationMinutes
}) => {
    // 1. If stylist is not working or off on this day, return empty
    if (!workingHours || !workingHours.is_working || !workingHours.start_time || !workingHours.end_time) {
        return [];
    }

    const startMinutes = parseTimeToMinutes(workingHours.start_time);
    const endMinutes = parseTimeToMinutes(workingHours.end_time);

    // Target date timestamp ranges
    const targetDayStart = new Date(`${dateStr}T00:00:00`);
    const targetDayEnd = new Date(`${dateStr}T23:59:59`);

    // 2. Convert unavailability blocks to minute intervals for the target day
    const blockedIntervals = unavailability.map((block) => {
        const blockStart = new Date(block.start_datetime);
        const blockEnd = new Date(block.end_datetime);

        // If block does not overlap with target day, ignore
        if (blockEnd <= targetDayStart || blockStart >= targetDayEnd) {
            return null;
        }

        // Determine start/end minutes clamped to target day
        let startMin = 0;
        if (blockStart > targetDayStart) {
            startMin = blockStart.getHours() * 60 + blockStart.getMinutes();
        }

        let endMin = 1440; // 24 hours in minutes
        if (blockEnd < targetDayEnd) {
            endMin = blockEnd.getHours() * 60 + blockEnd.getMinutes();
        }

        return { startMin, endMin };
    }).filter(Boolean);

    // 3. Convert existing appointments to minute intervals
    const appointmentIntervals = appointments.map((appt) => {
        const startMin = parseTimeToMinutes(appt.start_time);
        const endMin = parseTimeToMinutes(appt.end_time);
        return { startMin, endMin };
    });

    // Combine all blocked ranges
    const allBlockedIntervals = [...blockedIntervals, ...appointmentIntervals];

    // 4. Generate candidate time slots at 30-minute intervals
    const availableSlots = [];
    const slotInterval = 30; // generate slot starts every 30 minutes

    for (let currentSlotStart = startMinutes; currentSlotStart + durationMinutes <= endMinutes; currentSlotStart += slotInterval) {
        const currentSlotEnd = currentSlotStart + durationMinutes;

        // Check if slot overlaps with any blocked interval
        const hasOverlap = allBlockedIntervals.some((block) => {
            // Overlap condition: slotStart < blockEnd AND slotEnd > blockStart
            return currentSlotStart < block.endMin && currentSlotEnd > block.startMin;
        });

        if (!hasOverlap) {
            availableSlots.push(minutesToTimeStr(currentSlotStart));
        }
    }

    return availableSlots;
};
