// server/tests/phase4.test.js
import { serviceRepository } from '../src/repositories/serviceRepository.js';
import { staffRepository } from '../src/repositories/staffRepository.js';
import { appointmentRepository } from '../src/repositories/appointmentRepository.js';
import { calculateAvailableSlots } from '../src/utils/slotCalculator.js';

const runTests = async () => {
    console.log('--- STARTING PHASE 4 APPOINTMENT BOOKING VERIFICATION TESTS ---');

    try {
        // 1. Verify Slot Calculation Logic
        console.log('Test 1: Calculating slots for Alex Stylist (ID: 3) for next Monday...');
        const service = await serviceRepository.findById(1); // Haircut (30 mins)
        if (!service) throw new Error('Service Haircut not found.');

        const targetDate = '2026-07-27'; // A Monday
        const schedule = (await staffRepository.getSchedule(3)).find((s) => s.day_of_week === 'MONDAY');
        const unavailability = await staffRepository.getUnavailability(3);
        const existingAppts = await appointmentRepository.getAppointmentsForStylist(3, targetDate);

        const slots = calculateAvailableSlots({
            workingHours: schedule,
            unavailability,
            appointments: existingAppts,
            dateStr: targetDate,
            durationMinutes: service.duration_minutes
        });

        console.log(`Available slots found: ${slots.length}`);
        if (slots.length === 0) {
            throw new Error('Expected slots to be available for a working shift.');
        }
        console.log('Test 1 PASSED.');

        // 2. Perform Booking & Double Booking Overlap Test
        console.log('\nTest 2: Creating a test booking...');
        const testSlot = slots[0]; // e.g. "09:00"
        const hexRandom = Math.random().toString(16).substring(2, 6).toUpperCase();
        const bookingReference = `TEST-${hexRandom}`;

        const newAppt = await appointmentRepository.create({
            customerId: 1, // Default customer
            staffId: 3, // Alex Stylist
            bookingReference,
            appointmentDate: targetDate,
            startTime: `${testSlot}:00`,
            endTime: '09:30:00',
            totalDurationMinutes: 30,
            totalPrice: service.price,
            notes: 'Test session',
            serviceIds: [1]
        });

        console.log(`Created test booking ID: ${newAppt.id} Ref: ${bookingReference}`);

        console.log('\nTest 3: Checking double-booking protection (overlapping slot)...');
        const hasOverlap = await appointmentRepository.checkTimeOverlap(3, targetDate, `${testSlot}:00`, '09:30:00');
        if (!hasOverlap) {
            throw new Error('Overlap check failed. System allowed double-booking on the same slot.');
        }
        console.log('Double-booking overlap check correctly BLOCKED the slot! Test 3 PASSED.');

        // 3. Cancel and Restore availability
        console.log('\nTest 4: Cancelling the test appointment and restoring availability...');
        await appointmentRepository.updateStatus(newAppt.id, 'CANCELLED');

        const hasOverlapAfterCancel = await appointmentRepository.checkTimeOverlap(3, targetDate, `${testSlot}:00`, '09:30:00');
        if (hasOverlapAfterCancel) {
            throw new Error('Cancelled appointment is still blocking the slot.');
        }
        console.log('Test 4 PASSED.');

        console.log('\n======================================================');
        console.log('ALL PHASE 4 APPOINTMENT BOOKING TESTS PASSED!');
        console.log('======================================================');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ PHASE 4 TESTS FAILED:', err.message || err);
        process.exit(1);
    }
};

runTests();
