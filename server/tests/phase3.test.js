import { serviceRepository } from '../src/repositories/serviceRepository.js';
import { staffRepository } from '../src/repositories/staffRepository.js';

const runTests = async () => {
  console.log('--- STARTING PHASE 3 BACKEND VERIFICATION TESTS ---');

  try {
    // 1. Verify service list and count
    console.log('Test 1: Fetching seeded services...');
    const { services, total } = await serviceRepository.listAll({ limit: 100 });
    console.log(`Found ${total} total services in database.`);
    if (total < 7) {
      throw new Error(`Expected at least 7 seeded services, found ${total}`);
    }
    console.log('Test 1 PASSED.');

    // 2. Verify finding service by name
    console.log('\nTest 2: Finding service by name "Haircut"...');
    const haircut = await serviceRepository.findByName('Haircut');
    if (!haircut) {
      throw new Error('Could not find service "Haircut" in database.');
    }
    console.log(`Haircut Service ID: ${haircut.id}, Price: ${haircut.price}, Duration: ${haircut.duration_minutes} mins`);
    console.log('Test 2 PASSED.');

    // 3. Verify staff-service assignment
    console.log('\nTest 3: Fetching assigned staff for Haircut...');
    const staffIds = await serviceRepository.getAssignedStaffIds(haircut.id);
    console.log('Assigned staff IDs:', staffIds);
    if (!staffIds.includes(3)) {
      throw new Error('Alex Stylist (user_id = 3) is expected to be assigned to Haircut.');
    }
    console.log('Test 3 PASSED.');

    // 4. Verify staff schedule retrieval
    console.log('\nTest 4: Retrieving weekly schedule for Alex Stylist (user_id = 3)...');
    const schedule = await staffRepository.getSchedule(3);
    console.log(`Schedule contains ${schedule.length} daily entries.`);
    const monday = schedule.find((s) => s.day_of_week === 'MONDAY');
    if (!monday || !monday.is_working) {
      throw new Error('Expected Alex Stylist to be working on Monday.');
    }
    console.log(`Monday schedule: ${monday.start_time} - ${monday.end_time}`);
    console.log('Test 4 PASSED.');

    // 5. Verify staff unavailability operations
    console.log('\nTest 5: Adding and deleting custom unavailability slot...');
    const testUnavail = await staffRepository.addUnavailability(3, {
      unavailabilityType: 'BREAK',
      startDatetime: '2026-07-25T12:00:00',
      endDatetime: '2026-07-25T13:00:00',
      description: 'Lunch break'
    });
    console.log(`Successfully blocked slot. ID: ${testUnavail.id}`);
    
    // Verify it is listed
    const activeBlocks = await staffRepository.getUnavailability(3);
    const foundBlock = activeBlocks.find((b) => b.id === testUnavail.id);
    if (!foundBlock) {
      throw new Error('Could not find newly created unavailability block.');
    }
    console.log('Found blocked slot in DB.');

    // Delete it
    const deleted = await staffRepository.deleteUnavailability(3, testUnavail.id);
    if (!deleted) {
      throw new Error('Failed to delete unavailability block.');
    }
    console.log('Successfully deleted blocked slot.');
    console.log('Test 5 PASSED.');

    console.log('\n=========================================');
    console.log('ALL PHASE 3 BACKEND TESTS PASSED SUCCESSFULLY!');
    console.log('=========================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ PHASE 3 TESTS FAILED:', error.message || error);
    process.exit(1);
  }
};

runTests();
