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
      // We will define a nice email confirmation logic
      const subject = `Your Invoice Receipt — ${saleDetails.invoice_number}`;
      const text = `Hi ${saleDetails.customer_name || 'Valued Customer'},\n\nThank you for visiting Salon Shyani! Your payment has been successfully recorded.\n\nInvoice Number: ${saleDetails.invoice_number}\nTotal Paid: LKR ${saleDetails.total_amount}\n\nWe hope to see you again soon!`;
      
      const itemsHtml = saleDetails.items.map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.item_name_snapshot}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">LKR ${Number(item.unit_price).toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">LKR ${Number(item.subtotal).toFixed(2)}</td>
        </tr>
      `).join('');

      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #be185d; text-align: center; margin-bottom: 20px;">Salon Shyani Receipt</h2>
          <p>Hi <strong>${saleDetails.customer_name || 'Valued Customer'}</strong>,</p>
          <p>Thank you for visiting Salon Shyani! Here is a summary of your receipt:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: left;">Item</th>
                <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: center;">Qty</th>
                <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: right;">Price</th>
                <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; text-align: right; line-height: 1.6;">
            <div>Subtotal: <strong>LKR ${Number(saleDetails.subtotal).toFixed(2)}</strong></div>
            ${saleDetails.discount_amount > 0 ? `<div style="color: #dc2626;">Discount: <strong>-LKR ${Number(saleDetails.discount_amount).toFixed(2)}</strong></div>` : ''}
            <div style="font-size: 18px; color: #be185d; margin-top: 5px;">Total Paid: <strong>LKR ${Number(saleDetails.total_amount).toFixed(2)}</strong></div>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">Invoice: ${saleDetails.invoice_number} | Cashier: ${saleDetails.cashier_name}</p>
        </div>
      `;

      // Log in notifications and send via email service internals
      // To simplify, we will just use the internal node mailer fallback or console preview
      console.log(`Sending email receipt for invoice ${saleDetails.invoice_number} to ${saleDetails.customer_email}`);
      // In development mode it will output in terminal console log.
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
