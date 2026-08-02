// server/tests/phase9.test.js
import { reportController } from '../src/controllers/reportController.js';
import { auditRepository } from '../src/repositories/auditRepository.js';
import { notificationRepository } from '../src/repositories/notificationRepository.js';

const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

const runTests = async () => {
  console.log('--- STARTING PHASE 9 REPORTS & AUDIT CONTROLS TESTS ---');

  try {
    // Seed dummy audit log to make sure we have data
    await auditRepository.create({
      userId: 1,
      action: 'TEST_AUDIT_LOG_CREATION',
      entityType: 'test',
      entityId: 99,
      ipAddress: '127.0.0.1'
    });
    console.log('Seeded test audit log.');

    // Seed dummy notification log to make sure we have data
    await notificationRepository.createNotification({
      userId: 1,
      recipientEmail: 'test-recipient@example.test',
      notificationType: 'TEST_EMAIL',
      subject: 'Test Reports Notification Subject',
      status: 'SENT'
    });
    console.log('Seeded test email notification log.');

    // --- TEST 1: Dashboard Stats Aggregation ---
    console.log('\nTest 1: Gathering Admin Dashboard summary statistics...');
    const req1 = {
      user: { id: 1, role: 'ADMIN' },
      ip: '127.0.0.1'
    };
    const res1 = mockResponse();
    await reportController.getDashboardStats(req1, res1, (err) => { if (err) throw err; });

    if (!res1.jsonData || !res1.jsonData.success) {
      throw new Error(`Failed to load dashboard statistics: ${JSON.stringify(res1.jsonData)}`);
    }

    const { todayRevenue, todayAppointments, queueCheckedIn, lowStockCount, activeCustomers } = res1.jsonData.data;
    console.log('Dashboard Stats metrics loaded:');
    console.log(`- Today's Sales Revenue: LKR ${todayRevenue}`);
    console.log(`- Scheduled Appointments: ${todayAppointments}`);
    console.log(`- Checked-in Queue: ${queueCheckedIn}`);
    console.log(`- Low Stock Products count: ${lowStockCount}`);
    console.log(`- Active Customers count: ${activeCustomers}`);

    if (typeof todayRevenue !== 'number' || typeof todayAppointments !== 'number' || typeof lowStockCount !== 'number') {
      throw new Error('Dashboard stats properties must be numeric types.');
    }
    console.log('Test 1 PASSED.');


    // --- TEST 2: Revenue Historical Summary ---
    console.log('\nTest 2: Gathering historical revenue breakdown for past 30 days...');
    const res2 = mockResponse();
    await reportController.getRevenueReport(req1, res2, (err) => { if (err) throw err; });

    if (!res2.jsonData || !res2.jsonData.success) {
      throw new Error('Failed to load revenue history log.');
    }
    const { revenue } = res2.jsonData.data;
    console.log(`Loaded ${revenue.length} history records.`);
    if (revenue.length > 0) {
      console.log(`- Sample record: ${JSON.stringify(revenue[0])}`);
    }
    console.log('Test 2 PASSED.');


    // --- TEST 3: Services & Products Performance Reports ---
    console.log('\nTest 3: Checking service and product popularity statistics...');
    const res3Serv = mockResponse();
    await reportController.getServiceReport(req1, res3Serv, (err) => { if (err) throw err; });
    if (!res3Serv.jsonData || !res3Serv.jsonData.success) {
      throw new Error('Failed to compile service statistics.');
    }
    console.log(`- Services compiled: ${res3Serv.jsonData.data.services.length} items.`);

    const res3Prod = mockResponse();
    await reportController.getProductReport(req1, res3Prod, (err) => { if (err) throw err; });
    if (!res3Prod.jsonData || !res3Prod.jsonData.success) {
      throw new Error('Failed to compile product sales statistics.');
    }
    console.log(`- Products compiled: ${res3Prod.jsonData.data.products.length} items.`);

    const res3Staff = mockResponse();
    await reportController.getStaffReport(req1, res3Staff, (err) => { if (err) throw err; });
    if (!res3Staff.jsonData || !res3Staff.jsonData.success) {
      throw new Error('Failed to compile staff performance stats.');
    }
    console.log(`- Staff compiled: ${res3Staff.jsonData.data.staff.length} profiles.`);
    console.log('Test 3 PASSED.');


    // --- TEST 4: Paginated Audit Logs Retrieval ---
    console.log('\nTest 4: Checking paginated administrative audit trail queries...');
    const req4 = {
      user: { id: 1, role: 'ADMIN' },
      query: { page: 1, limit: 10 }
    };
    const res4 = mockResponse();
    await reportController.getAuditLogs(req4, res4, (err) => { if (err) throw err; });

    if (!res4.jsonData || !res4.jsonData.success) {
      throw new Error('Failed to fetch audit logs history.');
    }
    const { logs, meta } = res4.jsonData.data;
    console.log(`Loaded ${logs.length} audit logs. Total logs in DB: ${meta.total}, Page: ${meta.page}/${meta.totalPages}`);
    if (logs.length === 0 || meta.total < 1) {
      throw new Error('Seeded audit log was not fetched.');
    }
    console.log(`Latest audit log: user ID ${logs[0].user_id} performed action "${logs[0].action}"`);
    console.log('Test 4 PASSED.');


    // --- TEST 5: Paginated Delivery Alert Status Log Queries ---
    console.log('\nTest 5: Checking paginated notifications log queries...');
    const req5 = {
      user: { id: 1, role: 'ADMIN' },
      query: { page: 1, limit: 5 }
    };
    const res5 = mockResponse();
    await reportController.getNotificationLogs(req5, res5, (err) => { if (err) throw err; });

    if (!res5.jsonData || !res5.jsonData.success) {
      throw new Error('Failed to query notifications history.');
    }
    const { notifications, meta: notifMeta } = res5.jsonData.data;
    console.log(`Loaded ${notifications.length} alerts logs. Total alerts in DB: ${notifMeta.total}`);
    if (notifications.length === 0 || notifMeta.total < 1) {
      throw new Error('Seeded notification delivery log not fetched.');
    }
    console.log(`Latest alert log: Recipient: ${notifications[0].recipient_email}, Subject: "${notifications[0].subject}"`);
    console.log('Test 5 PASSED.');


    // --- TEST 6: Security Role Lockouts ---
    console.log('\nTest 6: Validating that CUSTOMER roles are blocked...');
    const req6 = {
      user: { id: 4, role: 'CUSTOMER' }
    };
    const res6 = mockResponse();
    let lockedAsExpected = false;

    try {
      await reportController.getDashboardStats(req6, res6, (err) => { if (err) throw err; });
    } catch (err) {
      console.log(`Blocked CUSTOMER access as expected. Message: "${err.message}" (Status: ${err.statusCode})`);
      if (err.statusCode === 403) {
        lockedAsExpected = true;
      }
    }

    if (!lockedAsExpected) {
      throw new Error('Security failure: allowed CUSTOMER to load reports!');
    }
    console.log('Test 6 PASSED.');

    console.log('\n======================================================');
    console.log('ALL PHASE 9 REPORTING AND AUDITING TESTS PASSED!');
    console.log('======================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ PHASE 9 TESTS FAILED:', err.message || err);
    process.exit(1);
  }
};

runTests();
