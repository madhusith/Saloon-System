// server/tests/phase8.test.js
import { orderController } from '../src/controllers/orderController.js';
import { productRepository } from '../src/repositories/productRepository.js';
import { inventoryRepository } from '../src/repositories/inventoryRepository.js';
import { orderRepository } from '../src/repositories/orderRepository.js';
import { pool } from '../src/config/database.js';

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
  console.log('--- STARTING PHASE 8 ONLINE SHOP VERIFICATION TESTS ---');

  let testProductId = null;
  let testOrderId = null;

  try {
    // Seed a test product
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const testSku = `SHP-SKU-${randSuffix}`;
    const prodName = `Test Gel Polish ${randSuffix}`;
    
    console.log(`\nStep 0: Seeding test product ${prodName}...`);
    const product = await productRepository.create({
      sku: testSku,
      name: prodName,
      description: 'Polish for online shop automated tests.',
      category: 'NAILS',
      costPrice: 400.00,
      sellingPrice: 750.00,
      stockQuantity: 10,
      reorderLevel: 2
    });
    testProductId = product.id;
    console.log(`Product created with ID: ${testProductId}, stock: 10`);

    // --- TEST 1: Create Order (Deducts stock & logs ONLINE_ORDER & records payments) ---
    console.log('\nTest 1: Simulating customer checkout order placement...');
    const req1 = {
      user: { id: 1, role: 'CUSTOMER', fullName: 'Alice Customer', email: 'alice@test.com' },
      body: {
        pickupDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days in future
        customerNote: 'Leave at front desk',
        paymentMethod: 'ONLINE',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryDate: '12/28',
          cvv: '123'
        },
        items: [
          { productId: testProductId, quantity: 3 }
        ]
      },
      ip: '127.0.0.1'
    };
    const res1 = mockResponse();
    
    await orderController.createOrder(req1, res1, (err) => { if (err) throw err; });
    
    if (!res1.jsonData || !res1.jsonData.success) {
      throw new Error(`Order placement failed: ${JSON.stringify(res1.jsonData)}`);
    }

    testOrderId = res1.jsonData.data.orderId;
    console.log(`Order placed successfully. ID: ${testOrderId}, Reference: ${res1.jsonData.data.orderReference}`);

    // Verify stock is decremented to 7
    const prodAfter = await productRepository.findById(testProductId);
    console.log(`Product stock after checkout: ${prodAfter.stock_quantity} (Expected: 7)`);
    if (prodAfter.stock_quantity !== 7) {
      throw new Error(`Stock decrement failed. Got ${prodAfter.stock_quantity}, expected 7.`);
    }

    // Verify stock_movements has ONLINE_ORDER movement log
    const { movements } = await inventoryRepository.listMovements({
      productId: testProductId,
      movementType: 'ONLINE_ORDER',
      limit: 1
    });
    if (movements.length === 0) {
      throw new Error('ONLINE_ORDER stock movement log was not found.');
    }
    const movement = movements[0];
    console.log(`Found ONLINE_ORDER log: Qty: ${movement.quantity}, Stock log: ${movement.stock_before} -> ${movement.stock_after}`);
    if (movement.quantity !== -3 || movement.stock_after !== 7) {
      throw new Error('ONLINE_ORDER movement log values are incorrect.');
    }

    // Verify payments table has ONLINE paid entry linked to order_id
    const orderDetails = await orderRepository.findById(testOrderId);
    console.log(`Order payment status: ${orderDetails.payment_status}, order status: ${orderDetails.order_status}`);
    if (orderDetails.payment_status !== 'PAID' || orderDetails.order_status !== 'PAID') {
      throw new Error('Order statuses are incorrect. Expected PAID / PAID.');
    }
    if (orderDetails.payments.length === 0) {
      throw new Error('No payment records linked to this order.');
    }
    console.log(`Linked Payment found: Method: ${orderDetails.payments[0].payment_method}, Ref: ${orderDetails.payments[0].transaction_reference}`);
    if (orderDetails.payments[0].payment_method !== 'ONLINE') {
      throw new Error('Payment method mismatch.');
    }
    console.log('Test 1 PASSED.');


    // --- TEST 2: Out of stock checkout failure ---
    console.log('\nTest 2: Verifying out of stock checkout failure...');
    const req2 = {
      user: { id: 1, role: 'CUSTOMER', fullName: 'Alice Customer', email: 'alice@test.com' },
      body: {
        pickupDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        paymentMethod: 'ONLINE',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryDate: '12/28',
          cvv: '123'
        },
        items: [
          { productId: testProductId, quantity: 8 } // Available is 7, requested is 8
        ]
      },
      ip: '127.0.0.1'
    };
    const res2 = mockResponse();
    let failedAsExpected = false;
    
    try {
      await orderController.createOrder(req2, res2, (err) => { if (err) throw err; });
    } catch (err) {
      console.log(`Order failed as expected with message: "${err.message}"`);
      failedAsExpected = true;
    }

    if (!failedAsExpected) {
      throw new Error('Checkout allowed checking out more items than available in inventory!');
    }
    console.log('Test 2 PASSED.');


    // --- TEST 3: Admin transitions status PAID -> PROCESSING -> READY -> COMPLETED ---
    console.log('\nTest 3: Simulating administrative order state updates...');
    const req3 = {
      user: { id: 2, role: 'ADMIN', fullName: 'Boss Admin' },
      params: { id: testOrderId },
      body: { orderStatus: 'PROCESSING' },
      ip: '127.0.0.1'
    };
    const res3 = mockResponse();
    await orderController.updateOrderStatus(req3, res3, (err) => { if (err) throw err; });
    console.log(`Updated status to PROCESSING. Response: ${res3.jsonData.message}`);

    // Update to READY
    req3.body.orderStatus = 'READY';
    const res3b = mockResponse();
    await orderController.updateOrderStatus(req3, res3b, (err) => { if (err) throw err; });
    console.log(`Updated status to READY. Response: ${res3b.jsonData.message}`);

    // Update to COMPLETED
    req3.body.orderStatus = 'COMPLETED';
    const res3c = mockResponse();
    await orderController.updateOrderStatus(req3, res3c, (err) => { if (err) throw err; });
    console.log(`Updated status to COMPLETED. Response: ${res3c.jsonData.message}`);

    const finalOrder = await orderRepository.findById(testOrderId);
    if (finalOrder.order_status !== 'COMPLETED') {
      throw new Error(`Order status transition failed. Current: ${finalOrder.order_status}`);
    }
    console.log('Test 3 PASSED.');


    // --- TEST 4: Customer Order Cancellation (Restores stock & logs ORDER_CANCELLATION) ---
    console.log('\nTest 4: Simulating customer order cancellation...');
    // Create a new order to cancel
    const resNewOrder = mockResponse();
    const reqNewOrder = {
      user: { id: 1, role: 'CUSTOMER', fullName: 'Alice Customer', email: 'alice@test.com' },
      body: {
        pickupDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        paymentMethod: 'ONLINE',
        cardDetails: {
          cardNumber: '4111111111111111',
          expiryDate: '12/28',
          cvv: '123'
        },
        items: [
          { productId: testProductId, quantity: 2 } // Deducts stock from 7 to 5
        ]
      },
      ip: '127.0.0.1'
    };
    await orderController.createOrder(reqNewOrder, resNewOrder, (err) => { if (err) throw err; });
    const cancelOrderId = resNewOrder.jsonData.data.orderId;
    console.log(`Placed order ${cancelOrderId} to cancel. Product stock is now 5.`);

    // Customer cancels order
    const reqCancel = {
      user: { id: 1, role: 'CUSTOMER', fullName: 'Alice Customer', email: 'alice@test.com' },
      params: { id: cancelOrderId },
      ip: '127.0.0.1'
    };
    const resCancel = mockResponse();
    await orderController.cancelOrder(reqCancel, resCancel, (err) => { if (err) throw err; });
    console.log(`Cancelled order successfully. Message: ${resCancel.jsonData.message}`);

    // Verify stock is restored back to 7
    const prodRestored = await productRepository.findById(testProductId);
    console.log(`Product stock after cancellation: ${prodRestored.stock_quantity} (Expected: 7)`);
    if (prodRestored.stock_quantity !== 7) {
      throw new Error(`Stock restoration failed. Got ${prodRestored.stock_quantity}, expected 7.`);
    }

    // Verify stock_movements has ORDER_CANCELLATION log
    const { movements: cancelMovements } = await inventoryRepository.listMovements({
      productId: testProductId,
      movementType: 'ORDER_CANCELLATION',
      limit: 1
    });
    if (cancelMovements.length === 0) {
      throw new Error('ORDER_CANCELLATION stock movement log not found.');
    }
    const cancelLog = cancelMovements[0];
    console.log(`Found ORDER_CANCELLATION log: Qty: ${cancelLog.quantity}, Stock log: ${cancelLog.stock_before} -> ${cancelLog.stock_after}`);
    if (cancelLog.quantity !== 2 || cancelLog.stock_after !== 7) {
      throw new Error('ORDER_CANCELLATION log parameters are incorrect.');
    }

    // Verify payment is marked REFUNDED
    const cancelledOrder = await orderRepository.findById(cancelOrderId);
    if (cancelledOrder.payment_status !== 'REFUNDED' || cancelledOrder.order_status !== 'CANCELLED') {
      throw new Error('Cancelled order status flags are incorrect.');
    }
    console.log('Test 4 PASSED.');


    // Cleanup
    console.log('\nStep 5: Cleaning up automated verification records...');
    const cleanupConn = await pool.getConnection();
    await cleanupConn.execute('DELETE FROM payments WHERE order_id = ?', [testOrderId]);
    await cleanupConn.execute('DELETE FROM payments WHERE order_id = ?', [cancelOrderId]);
    await cleanupConn.execute('DELETE FROM stock_movements WHERE product_id = ?', [testProductId]);
    await cleanupConn.execute('DELETE FROM order_items WHERE order_id = ?', [testOrderId]);
    await cleanupConn.execute('DELETE FROM order_items WHERE order_id = ?', [cancelOrderId]);
    await cleanupConn.execute('DELETE FROM orders WHERE id = ?', [testOrderId]);
    await cleanupConn.execute('DELETE FROM orders WHERE id = ?', [cancelOrderId]);
    await cleanupConn.execute('DELETE FROM products WHERE id = ?', [testProductId]);
    cleanupConn.release();
    console.log('Cleanup completed successfully.');

    console.log('\n======================================================');
    console.log('ALL PHASE 8 ONLINE SHOP TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PHASE 8 TESTS FAILED:', err.message || err);
    if (testProductId) {
      // Emergency cleanup
      try {
        console.log('Running emergency cleanup for product ID:', testProductId);
        const cleanupConn = await pool.getConnection();
        await cleanupConn.execute('DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE customer_id=1)');
        await cleanupConn.execute('DELETE FROM stock_movements WHERE product_id = ?', [testProductId]);
        await cleanupConn.execute('DELETE FROM order_items WHERE product_id = ?', [testProductId]);
        await cleanupConn.execute('DELETE FROM orders WHERE customer_id = 1');
        await cleanupConn.execute('DELETE FROM products WHERE id = ?', [testProductId]);
        cleanupConn.release();
        console.log('Emergency cleanup succeeded.');
      } catch (cleanupErr) {
        console.error('Failed emergency cleanup:', cleanupErr.message);
      }
    }
    process.exit(1);
  }
};

runTests();
