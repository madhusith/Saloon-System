// server/tests/phase7.test.js
import { productRepository } from '../src/repositories/productRepository.js';
import { inventoryRepository } from '../src/repositories/inventoryRepository.js';
import { posRepository } from '../src/repositories/posRepository.js';
import { pool } from '../src/config/database.js';

const runTests = async () => {
  console.log('--- STARTING PHASE 7 PRODUCTS & INVENTORY VERIFICATION TESTS ---');

  try {
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const testSku = `TST-SKU-${randSuffix}`;
    const productName = `Test Volumizing Spray ${randSuffix}`;
    
    // 1. Create product & log initial stock movement
    console.log(`\nTest 1: Creating test product ${productName} (SKU: ${testSku})...`);
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const product = await productRepository.create({
      sku: testSku,
      name: productName,
      description: 'A temporary product for automated validation testing.',
      category: 'HAIR',
      costPrice: 500.00,
      sellingPrice: 850.00,
      stockQuantity: 20,
      reorderLevel: 5
    });

    console.log(`Product created with ID: ${product.id}`);

    // Log the initial stock movement like productController does
    await inventoryRepository.logMovement({
      productId: product.id,
      movementType: 'STOCK_PURCHASE',
      quantity: 20,
      stockBefore: 0,
      stockAfter: 20,
      note: 'Initial stock intake on creation',
      createdBy: 1 // Seed admin user id
    }, connection);

    await connection.commit();
    connection.release();
    console.log('Product insertion and initial stock log committed.');

    // Verify initial stock movement log
    const { movements } = await inventoryRepository.listMovements({
      productId: product.id,
      limit: 10
    });
    
    if (movements.length === 0) {
      throw new Error('Initial stock movement log not found in database.');
    }
    const initMovement = movements[0];
    console.log(`Found movement entry: Type: ${initMovement.movement_type}, Qty: ${initMovement.quantity}, stock: ${initMovement.stock_before} -> ${initMovement.stock_after}`);
    if (initMovement.movement_type !== 'STOCK_PURCHASE' || initMovement.quantity !== 20) {
      throw new Error('Initial stock movement log parameters are incorrect.');
    }
    console.log('Test 1 PASSED.');

    // 2. Update product catalog details
    console.log('\nTest 2: Modifying product pricing and details...');
    await productRepository.update(product.id, {
      sellingPrice: 900.00,
      description: 'Updated description for testing.'
    });
    
    const updated = await productRepository.findById(product.id);
    console.log(`New selling price: LKR ${updated.selling_price}`);
    if (Number(updated.selling_price) !== 900.00 || updated.description !== 'Updated description for testing.') {
      throw new Error('Product updates were not stored correctly.');
    }
    console.log('Test 2 PASSED.');

    // 3. Manual stock adjustment logging
    console.log('\nTest 3: Simulating a manual stock adjustment for damage...');
    
    const adjustConnection = await pool.getConnection();
    await adjustConnection.beginTransaction();
    
    const [prodRows] = await adjustConnection.execute(
      'SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE',
      [product.id]
    );
    const stockBeforeAdjust = prodRows[0].stock_quantity;
    const quantityDiff = -3;
    const stockAfterAdjust = stockBeforeAdjust + quantityDiff;

    await adjustConnection.execute(
      'UPDATE products SET stock_quantity = ? WHERE id = ?',
      [stockAfterAdjust, product.id]
    );

    await inventoryRepository.logMovement({
      productId: product.id,
      movementType: 'DAMAGED_PRODUCT',
      quantity: quantityDiff,
      stockBefore: stockBeforeAdjust,
      stockAfter: stockAfterAdjust,
      note: 'Found 3 broken bottles on shelf',
      createdBy: 1
    }, adjustConnection);

    await adjustConnection.commit();
    adjustConnection.release();

    const { movements: adjustMovements } = await inventoryRepository.listMovements({
      productId: product.id,
      movementType: 'DAMAGED_PRODUCT',
      limit: 1
    });

    if (adjustMovements.length === 0) {
      throw new Error('Damaged product stock movement log entry was not found.');
    }
    const damageLog = adjustMovements[0];
    console.log(`Logged damage movement: Qty: ${damageLog.quantity}, Stock log: ${damageLog.stock_before} -> ${damageLog.stock_after}`);
    if (damageLog.quantity !== -3 || damageLog.stock_after !== 17) {
      throw new Error(`Damage log calculations incorrect. Expected 17, got ${damageLog.stock_after}`);
    }
    console.log('Test 3 PASSED.');

    // 4. POS automatic deduction & movement log
    console.log('\nTest 4: Simulating POS Checkout billing deduction...');
    
    // We will call posRepository.checkout
    const invoiceNumber = `TST-INV-${Date.now()}`;
    const checkoutData = {
      invoiceNumber,
      cashierId: 1, // Admin or Cashier user
      customerId: null,
      appointmentId: null,
      saleType: 'PRODUCT_ONLY',
      subtotal: 900.00 * 2, // 2 items
      discountAmount: 0.00,
      totalAmount: 900.00 * 2,
      paymentMethod: 'CASH',
      transactionReference: null,
      items: [
        {
          itemType: 'PRODUCT',
          productId: product.id,
          itemNameSnapshot: productName,
          quantity: 2,
          unitPrice: 900.00,
          subtotal: 1800.00
        }
      ],
      discountApproval: null
    };

    const checkoutResult = await posRepository.checkout(checkoutData);
    console.log(`Checkout result saleId: ${checkoutResult.saleId}, invoice: ${checkoutResult.invoiceNumber}`);

    // Verify stock was reduced
    const finalProd = await productRepository.findById(product.id);
    console.log(`Product stock after POS sale: ${finalProd.stock_quantity} (Expected: 15)`);
    if (finalProd.stock_quantity !== 15) {
      throw new Error(`POS stock decrement failed. Stock is ${finalProd.stock_quantity}, expected 15.`);
    }

    // Verify POS_SALE movement log was generated in database
    const { movements: saleMovements } = await inventoryRepository.listMovements({
      productId: product.id,
      movementType: 'POS_SALE',
      limit: 1
    });

    if (saleMovements.length === 0) {
      throw new Error('POS_SALE stock movement was not recorded in the database!');
    }
    const saleLog = saleMovements[0];
    console.log(`Found POS_SALE movement log: Qty: ${saleLog.quantity}, Stock log: ${saleLog.stock_before} -> ${saleLog.stock_after}`);
    if (saleLog.quantity !== -2 || saleLog.stock_before !== 17 || saleLog.stock_after !== 15) {
      throw new Error(`POS_SALE log parameters mismatch. Expected +17 -> 15 with qty -2.`);
    }
    console.log('Test 4 PASSED.');

    // 5. Verify low stock alert filtering
    console.log('\nTest 5: Validating low stock alerts trigger thresholds...');
    
    // Adjust stock down to 4 (below reorder level of 5)
    console.log('Adjusting stock to 4 to trigger low-stock alert...');
    const triggerConnection = await pool.getConnection();
    await triggerConnection.execute(
      'UPDATE products SET stock_quantity = 4 WHERE id = ?',
      [product.id]
    );
    triggerConnection.release();

    const allProds = await productRepository.listAll();
    const isAlerted = allProds.some(p => p.id === product.id && p.stock_quantity <= p.reorder_level);
    
    if (!isAlerted) {
      throw new Error('Test product did not trigger low-stock status when below reorder_level.');
    }
    console.log(`Low stock alert successfully triggered for product ${product.id} (Stock: 4, Reorder Level: 5).`);
    console.log('Test 5 PASSED.');

    // Cleanup
    console.log('\nCleaning up verification records...');
    const cleanupConn = await pool.getConnection();
    await cleanupConn.execute('DELETE FROM stock_movements WHERE product_id = ?', [product.id]);
    await cleanupConn.execute('DELETE FROM sale_items WHERE product_id = ?', [product.id]);
    await cleanupConn.execute('DELETE FROM sales WHERE id = ?', [checkoutResult.saleId]);
    await cleanupConn.execute('DELETE FROM products WHERE id = ?', [product.id]);
    cleanupConn.release();
    console.log('Cleanup completed successfully.');

    console.log('\n======================================================');
    console.log('ALL PHASE 7 PRODUCTS & INVENTORY TESTS PASSED!');
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PHASE 7 TESTS FAILED:', err.message || err);
    process.exit(1);
  }
};

runTests();
