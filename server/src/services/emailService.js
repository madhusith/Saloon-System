import nodemailer from 'nodemailer';
import { notificationRepository } from '../repositories/notificationRepository.js';

// Setup transport from env
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    })
  : null;

const sendMailInternal = async ({ to, subject, html, text }) => {
  const fromName = process.env.SMTP_FROM_NAME || 'Salon Management System';
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@salonmanagement.test';

  if (transporter) {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html
    });
    return info;
  } else {
    // Development mode fallback
    console.log('\n========================================================================');
    console.log(`✉️  [EMAIL PREVIEW] (Development Mode)`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (Text): \n${text}`);
    console.log('========================================================================\n');
    return { messageId: 'dev-mode-mock-id-' + Date.now() };
  }
};

export const emailService = {
  /**
   * Send verification email to a new user
   * @param {Object} user 
   * @param {String} verificationToken 
   */
  async sendVerificationEmail(user, verificationToken) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verifyUrl = `${clientUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;

    const subject = 'Verify Your Email Address';
    const text = `Hi ${user.fullName || 'there'},\n\nWelcome to the Salon! Please verify your email by clicking the link below:\n${verifyUrl}\n\nThis link will expire in 24 hours.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #be185d;">Verify Your Email Address</h2>
        <p>Hi ${user.fullName || 'there'},</p>
        <p>Welcome to the Salon! Please verify your email address to activate your account:</p>
        <a href="${verifyUrl}" style="display: inline-block; background-color: #be185d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0;">Verify Email</a>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #64748b;">${verifyUrl}</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `;

    // Log in database
    const notificationId = await notificationRepository.createNotification({
      userId: user.id,
      recipientEmail: user.email,
      notificationType: 'EMAIL_VERIFICATION',
      subject,
      status: 'PENDING'
    });

    try {
      await sendMailInternal({ to: user.email, subject, html, text });
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'SENT',
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'FAILED',
        errorMessage: error.message
      });
      throw error;
    }
  },

  /**
   * Send password reset email
   * @param {Object} user 
   * @param {String} resetToken 
   */
  async sendPasswordResetEmail(user, resetToken) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    const subject = 'Reset Your Password';
    const text = `Hi ${user.fullName},\n\nYou requested a password reset. Please click the link below to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #be185d;">Reset Your Password</h2>
        <p>Hi ${user.fullName},</p>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #be185d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0;">Reset Password</a>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #64748b;">${resetUrl}</p>
        <p>This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    const notificationId = await notificationRepository.createNotification({
      userId: user.id,
      recipientEmail: user.email,
      notificationType: 'PASSWORD_RESET',
      subject,
      status: 'PENDING'
    });

    try {
      await sendMailInternal({ to: user.email, subject, html, text });
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'SENT',
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'FAILED',
        errorMessage: error.message
      });
      throw error;
    }
  },

  /**
   * Send password changed confirmation
   * @param {Object} user 
   */
  async sendPasswordChangedEmail(user) {
    const subject = 'Your Password Was Changed';
    const text = `Hi ${user.fullName},\n\nThis email confirms that the password for your account has been successfully changed.\n\nIf you did not make this change, please contact salon administration immediately.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #be185d;">Your Password Was Changed</h2>
        <p>Hi ${user.fullName},</p>
        <p>This email confirms that the password for your account has been successfully changed.</p>
        <p style="color: #e11d48; font-weight: bold;">If you did not perform this change, please contact salon administration immediately.</p>
      </div>
    `;

    const notificationId = await notificationRepository.createNotification({
      userId: user.id,
      recipientEmail: user.email,
      notificationType: 'PASSWORD_CHANGED',
      subject,
      status: 'PENDING'
    });

    try {
      await sendMailInternal({ to: user.email, subject, html, text });
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'SENT',
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Failed to send password changed email:', error);
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'FAILED',
        errorMessage: error.message
      });
    }
  },

  /**
   * Send welcome email for newly created accounts (like staff created by admin)
   * @param {Object} user 
   * @param {String} tempPassword 
   */
  async sendWelcomeEmail(user, tempPassword = null) {
    const subject = 'Welcome to the Salon Management System';
    let text = `Hi ${user.fullName},\n\nAn account has been created for you with the role: ${user.role}.\n`;
    let html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #be185d;">Welcome to the Salon!</h2>
        <p>Hi ${user.fullName},</p>
        <p>An account has been created for you with the role: <strong>${user.role}</strong>.</p>
    `;

    if (tempPassword) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      text += `\nYour temporary password is: ${tempPassword}\nLog in here: ${clientUrl}/login\n\nYou will be required to change this password after your first login.`;
      html += `
        <p>Please log in using your email address and the temporary password below:</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 16px; margin: 15px 0; font-weight: bold; text-align: center;">
          ${tempPassword}
        </div>
        <p><a href="${clientUrl}/login" style="display: inline-block; background-color: #be185d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log In Now</a></p>
        <p style="color: #e11d48;"><strong>Note:</strong> You will be asked to change this password immediately after your first login.</p>
      `;
    }

    html += `</div>`;

    const notificationId = await notificationRepository.createNotification({
      userId: user.id,
      recipientEmail: user.email,
      notificationType: 'WELCOME_EMAIL',
      subject,
      status: 'PENDING'
    });

    try {
      await sendMailInternal({ to: user.email, subject, html, text });
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'SENT',
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'FAILED',
        errorMessage: error.message
      });
    }
  },

  /**
   * Send order confirmation email
   */
  async sendOrderPlacedEmail(user, order) {
    const subject = `Order Confirmed: ${order.order_reference}`;
    const text = `Hi ${user.fullName || 'there'},\n\nYour order has been placed and paid successfully.\nOrder Reference: ${order.order_reference}\nPickup Date: ${new Date(order.pickup_date).toLocaleDateString()}\nTotal Amount: LKR ${order.total_amount}\n\nWe will notify you when it's ready for pickup.`;
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.product_name_snapshot}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">LKR ${Number(item.unit_price).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">LKR ${Number(item.subtotal).toFixed(2)}</td>
      </tr>
    `).join('');
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #be185d; text-align: center;">Order Placement Confirmed</h2>
        <p>Hi <strong>${user.fullName || 'there'}</strong>,</p>
        <p>Thank you for shopping at Salon Shyani. Here is a summary of your online product order:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: left;">Product</th>
              <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: center;">Qty</th>
              <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: right;">Price</th>
              <th style="padding: 8px; border-bottom: 2px solid #cbd5e1; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; text-align: right;">
          <p style="font-size: 16px; color: #be185d;">Total: <strong>LKR ${Number(order.total_amount).toFixed(2)}</strong></p>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p><strong>Order Reference:</strong> ${order.order_reference}</p>
        <p><strong>Scheduled Pickup Date:</strong> ${new Date(order.pickup_date).toLocaleDateString()}</p>
        <p>We will send another email as soon as your items are packed and ready for pickup at our salon.</p>
      </div>
    `;

    const notificationId = await notificationRepository.createNotification({
      userId: user.id,
      recipientEmail: user.email,
      notificationType: 'ORDER_PLACED',
      subject,
      status: 'PENDING'
    });

    try {
      await sendMailInternal({ to: user.email, subject, html, text });
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'SENT',
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Failed to send order placed email:', error);
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'FAILED',
        errorMessage: error.message
      });
    }
  },

  /**
   * Send order ready email
   */
  async sendOrderReadyEmail(user, order) {
    const subject = `Your Order is Ready for Pickup: ${order.order_reference}`;
    const text = `Hi ${user.fullName},\n\nGreat news! Your product order is ready for pickup at Salon Shyani.\nOrder Reference: ${order.order_reference}\nPickup Date: ${new Date(order.pickup_date).toLocaleDateString()}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #be185d; text-align: center;">Order Ready for Pickup</h2>
        <p>Hi <strong>${user.fullName}</strong>,</p>
        <p>Great news! Your online product order has been packaged and is now ready for pickup at Salon Shyani.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 15px 0;">
          <p style="margin: 4px 0;"><strong>Order Ref:</strong> ${order.order_reference}</p>
          <p style="margin: 4px 0;"><strong>Total Items Paid:</strong> LKR ${Number(order.total_amount).toFixed(2)}</p>
          <p style="margin: 4px 0;"><strong>Scheduled Pickup Date:</strong> ${new Date(order.pickup_date).toLocaleDateString()}</p>
        </div>
        
        <p>Please present your order reference code when picking up your items at the front desk. We look forward to seeing you soon!</p>
      </div>
    `;

    const notificationId = await notificationRepository.createNotification({
      userId: user.id,
      recipientEmail: user.email,
      notificationType: 'ORDER_READY',
      subject,
      status: 'PENDING'
    });

    try {
      await sendMailInternal({ to: user.email, subject, html, text });
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'SENT',
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Failed to send order ready email:', error);
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'FAILED',
        errorMessage: error.message
      });
    }
  },

  /**
   * Send order completed email
   */
  async sendOrderCompletedEmail(user, order) {
    const subject = `Order Completed: ${order.order_reference}`;
    const text = `Hi ${user.fullName},\n\nThank you! Your order has been successfully picked up.\nOrder Reference: ${order.order_reference}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #be185d; text-align: center;">Order Handed Over</h2>
        <p>Hi <strong>${user.fullName}</strong>,</p>
        <p>This email confirms that you have successfully picked up your product order. Thank you for shopping with us!</p>
        <p><strong>Order Ref:</strong> ${order.order_reference}</p>
      </div>
    `;

    const notificationId = await notificationRepository.createNotification({
      userId: user.id,
      recipientEmail: user.email,
      notificationType: 'ORDER_COMPLETED',
      subject,
      status: 'PENDING'
    });

    try {
      await sendMailInternal({ to: user.email, subject, html, text });
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'SENT',
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Failed to send order completed email:', error);
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'FAILED',
        errorMessage: error.message
      });
    }
  },

  /**
   * Send order cancelled email
   */
  async sendOrderCancelledEmail(user, order) {
    const subject = `Order Cancelled: ${order.order_reference}`;
    const text = `Hi ${user.fullName},\n\nYour order has been cancelled and a full refund has been credited.\nOrder Reference: ${order.order_reference}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #be185d; text-align: center;">Order Cancellation & Refund</h2>
        <p>Hi <strong>${user.fullName}</strong>,</p>
        <p>Your product order has been successfully cancelled. A full refund of <strong>LKR ${Number(order.total_amount).toFixed(2)}</strong> has been credited back to your account.</p>
        <p><strong>Order Ref:</strong> ${order.order_reference}</p>
      </div>
    `;

    const notificationId = await notificationRepository.createNotification({
      userId: user.id,
      recipientEmail: user.email,
      notificationType: 'ORDER_CANCELLED',
      subject,
      status: 'PENDING'
    });

    try {
      await sendMailInternal({ to: user.email, subject, html, text });
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'SENT',
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Failed to send order cancelled email:', error);
      await notificationRepository.updateNotificationStatus(notificationId, {
        status: 'FAILED',
        errorMessage: error.message
      });
    }
  }
};
