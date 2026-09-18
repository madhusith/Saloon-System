import bcrypt from 'bcrypt';
import { posRepository } from '../repositories/posRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { appointmentRepository } from '../repositories/appointmentRepository.js';
import { emitEvent } from '../sockets/socket.js';
import { logAudit } from '../services/auditService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { emailService } from '../services/emailService.js';

// Add invoice helper directly if it is not in emailService, but we will write a wrapper
const sendEmailReceiptSafely = async (saleDetails) => {
  if (saleDetails.customer_email) {
    try {
      await emailService.sendInvoiceReceiptEmail(saleDetails);
    } catch (e) {
      console.error('Failed to send invoice receipt email:', e);
    }
  }
};

export const posController = {
  /**
   * Perform POS Billing checkout
   */
  async checkout(req, res, next) {
    const {
      appointmentId,
      customerId,
      subtotal,
      discountAmount,
      totalAmount,
      paymentMethod,
      transactionReference,
      items,
      adminOverrideEmail,
      adminOverridePassword
    } = req.body;

    const cashierId = req.user.id;

    try {
      // 1. Authorization: cashier or admin role required
      if (req.user.role !== 'CASHIER' && req.user.role !== 'ADMIN') {
        return next(new AppError('Only cashiers and administrators can perform checkout.', 403));
      }

      // 2. Validate cashier discount limits
      const discountPercentage = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
      let approvedBy = null;
      let discountApproval = null;

      if (discountPercentage > 10 && req.user.role === 'CASHIER') {
        // Exceeds 10% cashier limit, requires administrator override credentials
        if (!adminOverrideEmail || !adminOverridePassword) {
          return next(new AppError('Discount percentage exceeds cashier limit (10%). Valid administrator credentials override is required.', 400));
        }

        const adminUser = await userRepository.findByEmail(adminOverrideEmail);
        if (!adminUser || adminUser.role !== 'ADMIN' || adminUser.status !== 'ACTIVE') {
          return next(new AppError('Invalid administrator credentials override.', 400));
        }

        const passMatches = await bcrypt.compare(adminOverridePassword, adminUser.password_hash);
        if (!passMatches) {
          return next(new AppError('Invalid administrator credentials override.', 400));
        }

        approvedBy = adminUser.id;
        discountApproval = {
          approvedBy,
          discountPercentage,
          reason: `Admin Override Approved by ${adminUser.full_name}`
        };
      } else if (discountAmount > 0) {
        discountApproval = {
          approvedBy: cashierId,
          discountPercentage,
          reason: req.user.role === 'ADMIN' ? 'Admin Checkout' : 'Within Cashier Limit (<=10%)'
        };
      }

      // 3. Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 4. Determine sale type
      const hasProducts = items.some(item => item.itemType === 'PRODUCT');
      const hasServices = items.some(item => item.itemType === 'SERVICE');
      let saleType = 'WALK_IN';
      
      if (appointmentId) {
        saleType = hasProducts ? 'MIXED' : 'APPOINTMENT';
      } else {
        saleType = hasProducts && hasServices ? 'MIXED' : (hasProducts ? 'PRODUCT_ONLY' : 'WALK_IN');
      }

      // 5. Run checkout transaction
      const checkoutResult = await posRepository.checkout({
        invoiceNumber,
        cashierId,
        cashierName: req.user.fullName,
        customerId,
        appointmentId,
        saleType,
        subtotal,
        discountAmount,
        totalAmount,
        paymentMethod,
        transactionReference,
        items,
        discountApproval
      });

      // 6. Log audit trail
      await logAudit({
        userId: cashierId,
        action: 'POS_CHECKOUT_COMPLETED',
        entityType: 'sales',
        entityId: checkoutResult.saleId,
        newValuesJson: {
          invoiceNumber,
          totalAmount,
          paymentMethod,
          appointmentId
        },
        ipAddress: req.ip
      });

      // 7. Real-time updates push
      emitEvent('appointment:status-changed', {
        appointmentId,
        status: 'COMPLETED'
      });
      emitEvent('queue:updated');

      // 8. Retrieve customer and cashier names to send mock receipt
      let customerName = 'General Customer';
      let customerEmail = null;
      let customerPhone = null;

      if (customerId) {
        const customerUser = await userRepository.findById(customerId);
        if (customerUser) {
          customerName = customerUser.full_name;
          customerEmail = customerUser.email;
          customerPhone = customerUser.phone;
        }
      }

      // Trigger email receipt async
      sendEmailReceiptSafely({
        invoice_number: invoiceNumber,
        customer_name: customerName,
        customer_email: customerEmail,
        total_amount: totalAmount,
        subtotal,
        discount_amount: discountAmount,
        cashier_name: req.user.fullName,
        items
      });

      return sendSuccess(res, {
        message: 'Checkout completed successfully.',
        data: {
          saleId: checkoutResult.saleId,
          invoiceNumber,
          paymentId: checkoutResult.paymentId
        }
      });

    } catch (error) {
      return next(new AppError(error.message, 400));
    }
  }
};
