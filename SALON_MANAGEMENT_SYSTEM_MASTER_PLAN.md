# Salon Management System — Codex Master Build Plan

> **Purpose:** Upload this file to Codex and use it as the main project specification.  
> Codex should read this file before creating, changing, or extending the project.

---

## 1. Project Overview

Build a complete web-based **Salon Management System** with four user roles:

1. **Customer**
2. **Staff / Stylist**
3. **Cashier**
4. **Admin**

The system must manage:

- Email-based authentication
- User accounts and role permissions
- Salon services
- Staff/stylist profiles and schedules
- Customer appointment booking
- Stylist selection
- Appointment queue
- Walk-in customers
- POS billing
- Cash, card, and online payments
- Products and inventory
- Online product orders
- Email confirmations and reminders
- Reports and dashboards

The application should be responsive and work on desktop, tablet, and mobile devices.

---

## 2. Recommended Technology Stack

### Frontend

- React.js
- Vite
- JavaScript
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- Recharts
- Socket.IO Client

### Backend

- Node.js
- Express.js
- JavaScript
- MySQL
- JWT authentication
- bcrypt password hashing
- Socket.IO
- Nodemailer
- Multer for image upload
- PDFKit or jsPDF for invoices
- Joi or express-validator for request validation

### Deployment

- Azure App Service
- Azure Database for MySQL
- Azure Blob Storage
- Azure Communication Services Email or SendGrid

### Development Payment Method

Start with a **mock payment gateway**. Keep payment logic behind a reusable payment-service interface so a real gateway can be added later.

Never store full bank-card information in the database.

---

## 3. Codex Development Rules

Codex must follow these rules:

1. Read this file before making changes.
2. Use a clean frontend/backend separation.
3. Use reusable components and services.
4. Do not hardcode passwords, secrets, email credentials, or database credentials.
5. Store secrets in environment variables.
6. Validate every API request.
7. Protect every private route using authentication and role-based authorization.
8. Prevent appointment double booking at the backend and database level.
9. Use transactions for payments, sales, orders, appointments, and stock updates where needed.
10. Do not physically delete important financial, appointment, or stock records. Use status fields or soft deletion.
11. Keep the UI simple, modern, professional, and responsive.
12. After completing each feature:
    - Run the project
    - Fix errors
    - Test the related API
    - Update the project progress section
13. Do not silently change requirements. Document necessary changes.
14. Create readable code comments only where the logic is not obvious.
15. Add meaningful error messages for users and developers.

---

## 4. Suggested Project Structure

```text
salon-management-system/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── forms/
│   │   │   ├── tables/
│   │   │   └── charts/
│   │   ├── layouts/
│   │   │   ├── CustomerLayout.jsx
│   │   │   ├── StaffLayout.jsx
│   │   │   ├── CashierLayout.jsx
│   │   │   └── AdminLayout.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── customer/
│   │   │   ├── staff/
│   │   │   ├── cashier/
│   │   │   └── admin/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── routes/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── templates/
│   │   │   └── emails/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── uploads/
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
│
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   └── USER_GUIDE.md
│
├── TASK_PROGRESS.md
├── README.md
└── SALON_MANAGEMENT_SYSTEM_CODEX_MASTER_PLAN.md
```

---

## 5. User Roles and Permissions

### 5.1 Customer

The customer can:

- Register using email address
- Verify email address
- Log in using email and password
- Reset forgotten password
- View and update own profile
- View salon services
- View service prices and durations
- View stylists who provide a selected service
- Select a preferred stylist
- Select **Any Available Stylist**
- View available dates and time slots
- Book appointments
- View appointment status
- View booking history
- Cancel appointments according to salon rules
- Pay online for appointments
- View own payment history
- Download receipts
- Browse products
- Add products to cart
- Place product orders
- Pay online for product orders
- View order history and order status

The customer cannot:

- Change prices
- Change payment status
- Manage other users
- Manage staff schedules
- View salon-wide reports

### 5.2 Staff / Stylist

The staff member can:

- Log in using email and password
- Reset password
- View own profile
- View assigned services
- View working schedule
- View assigned appointments
- View today's appointments
- View customer name, selected services, time, and notes
- Update appointment status to:
  - Waiting
  - In Progress
  - Completed
- View only basic payment status:
  - Pending
  - Paid
  - Partially Paid
- Add unavailable periods or request leave
- Change own password

The staff member cannot:

- Accept payments
- Edit prices
- Apply discounts
- Process refunds
- Manage users
- View financial reports
- View other stylists' appointments unless authorized

### 5.3 Cashier

The cashier can:

- Log in using email and password
- View today's appointment queue
- Search appointments
- Check customers in
- Update queue status
- Create walk-in transactions
- Select services and products in the POS
- Select a stylist for a walk-in service
- Accept cash payments
- Accept card payments
- Mark authorized transactions as paid
- Generate and print invoices
- View own processed transactions
- View product stock
- Sell products
- Apply discounts within an Admin-defined limit
- Request or process limited refunds when Admin approval exists
- Update stock intake only if the Admin grants permission

The cashier cannot:

- Create or edit service prices
- Create or delete users
- Change payment gateway settings
- View unrestricted financial reports
- Approve large discounts

### 5.4 Admin

The Admin has full control.

The Admin can:

- Create Customer, Staff, Cashier, and Admin accounts
- Edit user details
- Assign roles
- Activate and deactivate accounts
- Reset user passwords
- Manage staff profiles
- Assign services to stylists
- Manage staff schedules
- Approve leave and unavailable periods
- Add, edit, deactivate, and delete services when safe
- Add, edit, deactivate, and delete products when safe
- Manage stock and low-stock levels
- Manage all appointments
- Reassign stylists
- Reschedule appointments
- Cancel appointments
- View all payment records
- Approve discounts and refunds
- Manage online payment settings
- Manage order statuses
- View business reports
- Configure notification settings
- Resend confirmation emails and receipts
- View failed notification logs

---

## 6. Authentication and Account Management

### 6.1 Login

All users must log in with:

```text
Email Address
Password
```

Each email address must be unique.

After login, redirect users according to role:

```text
CUSTOMER -> Customer Portal
STAFF    -> Staff Dashboard
CASHIER  -> Cashier Dashboard
ADMIN    -> Admin Panel
```

### 6.2 Customer Registration

Customer registration fields:

- Full name
- Email
- Phone number
- Password
- Confirm password

Registration process:

1. Validate the form.
2. Check whether the email already exists.
3. Hash the password using bcrypt.
4. Create the account as unverified.
5. Send an email verification link.
6. Activate login after successful email verification.

### 6.3 Admin-Created Accounts

The Admin can create:

- Customer accounts
- Staff accounts
- Cashier accounts
- Additional Admin accounts

For Staff accounts, collect:

- Full name
- Email
- Phone
- Temporary password
- Specialization
- Experience
- Profile photo
- Assigned services
- Working schedule
- Account status

The user should be asked to change the temporary password after first login.

### 6.4 Forgot Password

Process:

1. User enters email.
2. System creates a secure reset token.
3. System emails a password-reset link.
4. Token expires after a short period.
5. User enters a new password.
6. System invalidates the token.
7. System sends a password-changed confirmation email.

### 6.5 Security Requirements

- Use bcrypt for password hashing.
- Use short-lived access tokens.
- Prefer refresh-token support.
- Add rate limiting to login and password-reset APIs.
- Do not reveal whether an email exists during password reset.
- Store verification and reset tokens securely.
- Expire tokens.
- Log important account activity.
- Disable deactivated users from logging in.

---

## 7. Email Notifications and Confirmations

### 7.1 Required Email Types

#### Account Emails

- Email verification
- Welcome email
- Password-reset email
- Password-changed confirmation
- Account activation notice
- Account deactivation notice

#### Appointment Emails

- Appointment booking received
- Appointment confirmed
- Appointment rescheduled
- Stylist changed
- Appointment cancelled
- Appointment reminder
- Appointment completed

#### Payment Emails

- Payment successful
- Payment failed
- Partial payment recorded
- Refund approved
- Refund completed
- Digital receipt

#### Product Order Emails

- Order placed
- Payment confirmed
- Order processing
- Order ready
- Order completed
- Order cancelled

#### Internal Emails

- New appointment assigned to stylist
- Appointment cancelled or rescheduled
- Staff leave request
- Low-stock alert
- Failed payment alert
- Failed email notification alert

### 7.2 Appointment Confirmation Email Data

Include:

- Customer name
- Booking reference
- Service name
- Stylist name
- Date
- Start time
- Duration
- Total amount
- Payment status
- Salon contact details
- Cancellation policy

### 7.3 Appointment Reminder Timing

Default reminder rules:

- 24 hours before appointment
- Optional second reminder 2 hours before appointment

Make reminder timing configurable by Admin.

### 7.4 Email Delivery Logging

Store:

- Recipient email
- Email type
- Subject
- Related record ID
- Status
- Error message
- Sent timestamp
- Retry count

Statuses:

```text
PENDING
SENT
FAILED
```

### 7.5 Email Development Mode

During development:

- Use Nodemailer with a test SMTP provider.
- Add a development option that logs email preview links.
- Do not use real customer email addresses in seed data.

---

## 8. Service Management

The Admin can create and manage salon services.

Service fields:

- Service ID
- Name
- Description
- Category
- Duration in minutes
- Price
- Image
- Status
- Created date
- Updated date

Examples:

```text
Haircut
Hair Colouring
Facial
Hair Treatment
Manicure
Pedicure
Bridal Dressing
```

The Admin can assign one service to multiple stylists and one stylist to multiple services.

Use a many-to-many relationship through `staff_services`.

---

## 9. Staff and Schedule Management

### 9.1 Staff Profile

Fields:

- User account
- Specialization
- Experience
- Biography
- Profile image
- Status

### 9.2 Working Schedule

Store working hours by day.

Example:

```text
Monday    09:00 - 18:00
Tuesday   09:00 - 18:00
Wednesday OFF
Thursday  09:00 - 18:00
```

### 9.3 Unavailability

Support:

- Leave
- Breaks
- Meetings
- Personal unavailable periods
- Admin-blocked periods

### 9.4 Booking Availability

A time slot is available only when:

1. The stylist provides the selected service.
2. The stylist is scheduled to work.
3. The stylist is not on leave.
4. The slot is not blocked.
5. There is no overlapping appointment.
6. The entire service duration fits inside the working period.

---

## 10. Appointment Booking

### 10.1 Customer Booking Flow

```text
Select service
      ↓
View eligible stylists
      ↓
Select stylist or Any Available Stylist
      ↓
Select date
      ↓
View calculated available slots
      ↓
Select time slot
      ↓
Backend checks availability again
      ↓
Create appointment
      ↓
Generate booking reference
      ↓
Process payment if required
      ↓
Send confirmation email
```

### 10.2 Multiple Services

Support one or more services in a booking.

When multiple services are selected:

- Calculate total duration.
- Calculate total price.
- Only display stylists who can provide all selected services, or allow Admin-defined multi-staff booking in a future version.
- For the first version, use one stylist per appointment.

### 10.3 Appointment Statuses

```text
PENDING
CONFIRMED
WAITING
IN_PROGRESS
COMPLETED
CANCELLED
NO_SHOW
```

Recommended flow:

```text
PENDING -> CONFIRMED -> WAITING -> IN_PROGRESS -> COMPLETED
```

### 10.4 Booking Reference

Example:

```text
SAL-20260711-A83F
```

Reference numbers must be unique.

### 10.5 Double-Booking Prevention

The backend must check time overlap before inserting or updating an appointment.

Overlap condition:

```text
new_start < existing_end
AND
new_end > existing_start
```

Use a database transaction and locking strategy where appropriate.

Never depend only on frontend availability.

---

## 11. Appointment Queue

The live queue should show:

- Time
- Customer
- Service
- Stylist
- Payment status
- Appointment status
- Check-in time

Example:

| Time | Customer | Service | Stylist | Status |
|---|---|---|---|---|
| 9:00 AM | Nimal | Haircut | Kasun | Waiting |
| 9:45 AM | Amaya | Facial | Nadeesha | In Progress |
| 10:30 AM | Ruwan | Hair Colouring | Kasun | Confirmed |

Use Socket.IO to update the queue in real time.

Events may include:

```text
appointment:created
appointment:updated
appointment:checked-in
appointment:status-changed
appointment:cancelled
```

---

## 12. POS and Walk-In Sales

### 12.1 Walk-In Customer

An account is optional.

The cashier can:

- Select an existing customer
- Create a simple customer record
- Continue as a general walk-in customer

Optional walk-in fields:

- Name
- Phone
- Email

### 12.2 POS Flow

```text
Select appointment or walk-in customer
      ↓
Add services
      ↓
Add products
      ↓
Choose stylist when needed
      ↓
Calculate subtotal
      ↓
Apply permitted discount
      ↓
Calculate total
      ↓
Accept payment
      ↓
Save sale and payment
      ↓
Reduce stock
      ↓
Generate invoice
```

### 12.3 Discounts

- Admin can apply any approved discount.
- Cashier can apply only up to a configurable limit.
- Discounts above the cashier limit require Admin approval.
- Store who approved the discount.

### 12.4 Invoice

Invoice should include:

- Salon information
- Invoice number
- Date and time
- Cashier
- Customer
- Services
- Products
- Quantity
- Unit price
- Subtotal
- Discount
- Total
- Payment method
- Payment status

---

## 13. Products and Inventory

### 13.1 Product Fields

- Product ID
- Name
- Description
- Category
- Cost price
- Selling price
- Stock quantity
- Reorder level
- Image
- Status
- Created date
- Updated date

### 13.2 Inventory Rules

The system must:

- Reduce stock after successful POS sale.
- Reduce stock after confirmed online order payment.
- Restore stock after approved cancellation or return when applicable.
- Record all stock movements.
- Prevent sale when stock is insufficient.
- Warn the Admin when stock reaches the reorder level.
- Keep a complete stock history.

### 13.3 Stock Movement Types

```text
STOCK_PURCHASE
POS_SALE
ONLINE_ORDER
CUSTOMER_RETURN
DAMAGED_PRODUCT
MANUAL_ADJUSTMENT
ORDER_CANCELLATION
```

---

## 14. Online Product Shop

Customer features:

- Browse products
- Search products
- Filter by category
- View product details
- View stock availability
- Add to cart
- Change quantity
- Remove from cart
- Checkout
- Pay online
- View order history
- View order status

Order statuses:

```text
PENDING
PAID
PROCESSING
READY
COMPLETED
CANCELLED
```

The first version can support salon pickup. Delivery can be added later.

---

## 15. Payments

### 15.1 Payment Methods

```text
CASH
CARD
ONLINE
```

### 15.2 Payment Statuses

```text
PENDING
PAID
PARTIALLY_PAID
FAILED
REFUNDED
CANCELLED
```

### 15.3 Payment Permissions

| Action | Customer | Staff | Cashier | Admin |
|---|---:|---:|---:|---:|
| Pay online | Yes | No | No | No |
| View own payments | Yes | Basic only | Own transactions | All |
| Accept cash/card | No | No | Yes | Yes |
| Mark POS paid | No | No | Yes | Yes |
| Apply discount | No | No | Limited | Yes |
| Process refund | Request only | No | Limited | Yes |
| Configure gateway | No | No | No | Yes |
| View financial reports | No | No | Limited | Yes |

### 15.4 Payment Safety

- Never store full card numbers.
- Never store CVV.
- Use payment-gateway transaction references.
- Validate payment status using gateway callbacks/webhooks.
- Make webhook handlers idempotent.
- Do not mark a payment successful only because the frontend says it succeeded.
- Record all payment status changes.

---

## 16. Reports and Dashboards

### 16.1 Admin Dashboard

Show:

- Today's appointments
- Completed appointments
- Cancelled appointments
- Total customers
- Active stylists
- Daily revenue
- Monthly revenue
- Service sales
- Product sales
- Low-stock products
- Pending orders
- Failed payments
- Failed notifications

### 16.2 Reports

Generate:

- Daily revenue
- Weekly revenue
- Monthly revenue
- Revenue by payment method
- Revenue by service
- Revenue by product
- Product profit estimate
- Best-selling products
- Most popular services
- Staff performance
- Appointment completion rate
- Appointment cancellation rate
- No-show report
- Inventory movement report
- Low-stock report
- Refund report
- Discount report

Support:

- Date filters
- Print view
- PDF export
- CSV export where appropriate

---

## 17. Main Database Tables

### 17.1 `users`

```text
id
full_name
email
phone
password_hash
role
email_verified_at
must_change_password
status
created_at
updated_at
deleted_at
```

Roles:

```text
CUSTOMER
STAFF
CASHIER
ADMIN
```

Statuses:

```text
ACTIVE
INACTIVE
SUSPENDED
```

### 17.2 `auth_tokens`

```text
id
user_id
token_type
token_hash
expires_at
used_at
created_at
```

Token types:

```text
EMAIL_VERIFICATION
PASSWORD_RESET
REFRESH_TOKEN
```

### 17.3 `customer_profiles`

```text
id
user_id
address
notes
created_at
updated_at
```

### 17.4 `staff_profiles`

```text
id
user_id
specialization
experience_years
bio
profile_image_url
status
created_at
updated_at
```

### 17.5 `services`

```text
id
name
description
category
duration_minutes
price
image_url
status
created_at
updated_at
deleted_at
```

### 17.6 `staff_services`

```text
id
staff_id
service_id
created_at
```

Add a unique constraint on:

```text
staff_id + service_id
```

### 17.7 `staff_schedules`

```text
id
staff_id
day_of_week
start_time
end_time
is_available
created_at
updated_at
```

### 17.8 `staff_unavailability`

```text
id
staff_id
start_datetime
end_datetime
reason
status
approved_by
created_at
updated_at
```

### 17.9 `appointments`

```text
id
reference_number
customer_id
staff_id
appointment_date
start_time
end_time
status
payment_status
subtotal
discount_amount
total_amount
customer_note
cancellation_reason
created_by
created_at
updated_at
```

### 17.10 `appointment_services`

```text
id
appointment_id
service_id
service_name_snapshot
duration_minutes
unit_price
created_at
```

### 17.11 `products`

```text
id
sku
name
description
category
cost_price
selling_price
stock_quantity
reorder_level
image_url
status
created_at
updated_at
deleted_at
```

### 17.12 `orders`

```text
id
order_reference
customer_id
subtotal
discount_amount
total_amount
payment_status
order_status
pickup_date
customer_note
created_at
updated_at
```

### 17.13 `order_items`

```text
id
order_id
product_id
product_name_snapshot
quantity
unit_price
subtotal
created_at
```

### 17.14 `sales`

```text
id
invoice_number
cashier_id
customer_id
appointment_id
sale_type
subtotal
discount_amount
total_amount
payment_status
created_at
updated_at
```

Sale types:

```text
APPOINTMENT
WALK_IN
PRODUCT_ONLY
MIXED
```

### 17.15 `sale_items`

```text
id
sale_id
item_type
product_id
service_id
item_name_snapshot
quantity
unit_price
subtotal
created_at
```

Item types:

```text
PRODUCT
SERVICE
```

### 17.16 `payments`

```text
id
customer_id
appointment_id
order_id
sale_id
payment_method
amount
currency
transaction_reference
gateway_name
payment_status
paid_at
recorded_by
created_at
updated_at
```

### 17.17 `payment_status_history`

```text
id
payment_id
old_status
new_status
changed_by
reason
created_at
```

### 17.18 `stock_movements`

```text
id
product_id
movement_type
quantity
stock_before
stock_after
reference_type
reference_id
note
created_by
created_at
```

### 17.19 `notifications`

```text
id
user_id
recipient_email
notification_type
subject
related_entity_type
related_entity_id
status
error_message
retry_count
sent_at
created_at
```

### 17.20 `discount_approvals`

```text
id
sale_id
requested_by
approved_by
discount_percentage
status
reason
created_at
updated_at
```

### 17.21 `audit_logs`

```text
id
user_id
action
entity_type
entity_id
old_values_json
new_values_json
ip_address
created_at
```

---

## 18. Important Database Constraints

Add:

- Unique constraint on `users.email`
- Unique constraint on `appointments.reference_number`
- Unique constraint on `orders.order_reference`
- Unique constraint on `sales.invoice_number`
- Unique constraint on `products.sku`
- Foreign keys for all related tables
- Check constraints for non-negative prices and quantities where supported
- Indexes on:
  - appointment date
  - staff ID
  - customer ID
  - appointment status
  - payment status
  - order status
  - product category
  - notification status

Use `DECIMAL(12,2)` for monetary values.

Use MySQL transactions for:

- Appointment creation
- Appointment rescheduling
- POS checkout
- Online order confirmation
- Stock updates
- Payment recording
- Refunds

---

## 19. API Design

Base route:

```text
/api
```

### 19.1 Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
GET    /api/auth/verify-email
POST   /api/auth/resend-verification
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
PATCH  /api/auth/change-password
```

### 19.2 Users

```text
GET    /api/users
GET    /api/users/:id
POST   /api/users
PATCH  /api/users/:id
PATCH  /api/users/:id/status
POST   /api/users/:id/reset-password
DELETE /api/users/:id
```

### 19.3 Services

```text
GET    /api/services
GET    /api/services/:id
POST   /api/services
PATCH  /api/services/:id
PATCH  /api/services/:id/status
DELETE /api/services/:id
```

### 19.4 Staff

```text
GET    /api/staff
GET    /api/staff/:id
POST   /api/staff
PATCH  /api/staff/:id
GET    /api/staff/:id/services
PUT    /api/staff/:id/services
GET    /api/staff/:id/schedule
PUT    /api/staff/:id/schedule
POST   /api/staff/:id/unavailability
PATCH  /api/staff/unavailability/:id
```

### 19.5 Availability

```text
GET /api/availability/stylists
GET /api/availability/slots
```

Example query:

```text
/api/availability/slots?serviceIds=1,2&staffId=5&date=2026-07-20
```

### 19.6 Appointments

```text
GET    /api/appointments
GET    /api/appointments/:id
POST   /api/appointments
PATCH  /api/appointments/:id
PATCH  /api/appointments/:id/status
PATCH  /api/appointments/:id/reassign
PATCH  /api/appointments/:id/reschedule
POST   /api/appointments/:id/check-in
POST   /api/appointments/:id/cancel
GET    /api/appointments/my
GET    /api/appointments/today
```

### 19.7 Products

```text
GET    /api/products
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
PATCH  /api/products/:id/status
DELETE /api/products/:id
GET    /api/products/low-stock
```

### 19.8 Orders

```text
GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PATCH  /api/orders/:id/status
POST   /api/orders/:id/cancel
GET    /api/orders/my
```

### 19.9 POS and Sales

```text
POST   /api/pos/checkout
GET    /api/sales
GET    /api/sales/:id
GET    /api/sales/:id/invoice
POST   /api/sales/:id/refund-request
POST   /api/sales/:id/refund
```

### 19.10 Payments

```text
POST   /api/payments/create
POST   /api/payments/confirm
POST   /api/payments/webhook
GET    /api/payments
GET    /api/payments/:id
GET    /api/payments/my
POST   /api/payments/:id/refund
```

### 19.11 Inventory

```text
GET    /api/inventory
GET    /api/inventory/movements
POST   /api/inventory/adjustments
POST   /api/inventory/stock-in
```

### 19.12 Notifications

```text
GET    /api/notifications
POST   /api/notifications/:id/resend
GET    /api/notifications/settings
PUT    /api/notifications/settings
```

### 19.13 Reports

```text
GET /api/reports/dashboard
GET /api/reports/revenue
GET /api/reports/services
GET /api/reports/products
GET /api/reports/staff
GET /api/reports/appointments
GET /api/reports/inventory
GET /api/reports/refunds
GET /api/reports/discounts
```

---

## 20. Frontend Pages

### 20.1 Public Pages

- Home
- About
- Services
- Stylists
- Products
- Login
- Customer registration
- Email verification
- Forgot password
- Reset password

### 20.2 Customer Pages

- Customer dashboard
- Browse services
- Book appointment
- Select stylist
- Select date and slot
- Booking confirmation
- My appointments
- Appointment details
- Payment page
- Payment history
- Product shop
- Product details
- Cart
- Checkout
- My orders
- Order details
- Profile
- Notification center

### 20.3 Staff Pages

- Staff dashboard
- Today's schedule
- Upcoming appointments
- Appointment details
- Availability
- Leave requests
- Profile

### 20.4 Cashier Pages

- Cashier dashboard
- Today's queue
- Customer check-in
- Walk-in POS
- Appointment POS
- Sales history
- Invoice view
- Product stock
- Refund requests
- Profile

### 20.5 Admin Pages

- Admin dashboard
- User management
- Create user
- Staff management
- Staff service assignment
- Staff schedule management
- Service management
- Product management
- Inventory management
- Appointment management
- Queue overview
- Order management
- Payment management
- Refund approval
- Discount approval
- Reports
- Email logs
- Notification settings
- System settings
- Audit logs

---

## 21. Environment Variables

### Server `.env.example`

```env
NODE_ENV=development
PORT=5050
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_NAME=salon_management
DB_USER=root
DB_PASSWORD=

JWT_ACCESS_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_NAME=Salon Management System
SMTP_FROM_EMAIL=

PAYMENT_PROVIDER=mock
PAYMENT_SECRET=
PAYMENT_WEBHOOK_SECRET=

AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER=
```

### Client `.env.example`

```env
VITE_API_BASE_URL=http://localhost:5050/api
VITE_SOCKET_URL=http://localhost:5050
VITE_APP_NAME=Salon Management System
```

---

## 22. Standard API Response Format

Success:

```json
{
  "success": true,
  "message": "Appointment created successfully.",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "The selected time slot is no longer available.",
  "errors": []
}
```

Use correct HTTP status codes.

---

## 23. Validation Requirements

Validate:

- Email format
- Email uniqueness
- Password strength
- Phone number
- Positive prices
- Positive stock quantities
- Service duration
- Working-hour ranges
- Appointment date and time
- Staff availability
- Appointment overlap
- Product stock
- Discount limits
- Payment amounts
- File types and sizes
- Status transitions

Do not allow invalid appointment transitions.

Example:

```text
COMPLETED -> WAITING
```

should be rejected.

---

## 24. Security and Audit Requirements

Implement:

- Helmet
- CORS configuration
- Rate limiting
- Request validation
- SQL injection prevention using parameterized queries
- XSS-safe output
- Secure file upload rules
- Role-based middleware
- Resource ownership checks
- Audit logs for important actions
- Error handling without exposing internal stack traces in production
- Database backups
- Session/token revocation when account is deactivated

Audit these actions:

- Login attempts
- User creation and deactivation
- Role changes
- Service price changes
- Product price changes
- Stock adjustments
- Appointment reassignments
- Payment status changes
- Refunds
- Discount approvals
- Notification resends

---

## 25. Testing Requirements

### Backend Tests

Test:

- Registration
- Login
- Email verification
- Forgot password
- Role authorization
- Service CRUD
- Staff-service assignment
- Slot calculation
- Double-booking prevention
- Appointment creation
- Appointment cancellation
- POS checkout
- Stock deduction
- Order checkout
- Payment status update
- Refund flow
- Notification logging

### Frontend Tests

Test:

- Protected routes
- Role-based navigation
- Form validation
- Booking flow
- POS calculation
- Cart calculation
- Error messages
- Loading states
- Empty states
- Mobile responsiveness

### Manual Test Accounts

Create safe development accounts in `seed.sql`.

Example:

```text
admin@example.test
cashier@example.test
stylist@example.test
customer@example.test
```

Do not include real passwords in this document. Use a documented development password in the local README only.

---

## 26. Development Phases

### Phase 1 — Project Foundation

- Create client and server
- Configure MySQL
- Create schema and migrations
- Configure environment variables
- Add error handling
- Add validation
- Create base layouts
- Create API response utilities

### Phase 2 — Authentication and Users

- Customer registration
- Email verification
- Login
- JWT authorization
- Forgot password
- Reset password
- Role-based dashboards
- Admin user management

### Phase 3 — Services and Staff

- Service management
- Staff profile management
- Staff-service assignment
- Staff schedules
- Staff unavailability
- Eligible stylist lookup

### Phase 4 — Appointment Booking

- Customer booking flow
- Slot generation
- Preferred stylist selection
- Any Available Stylist
- Double-booking protection
- Appointment reference generation
- Customer appointment history
- Appointment emails

### Phase 5 — Queue and Staff Workflow

- Today's queue
- Check-in
- Waiting status
- In-progress status
- Completed status
- Real-time Socket.IO updates
- Staff appointment dashboard

### Phase 6 — POS and Payments

- Walk-in sales
- Appointment billing
- Product and service line items
- Discounts
- Cash and card payments
- Mock online payments
- Invoice generation
- Payment emails

### Phase 7 — Products and Inventory

- Product CRUD
- Stock management
- Stock movements
- Low-stock alerts
- Automatic stock deduction
- Stock adjustment permissions

### Phase 8 — Online Shop

- Product catalogue
- Cart
- Checkout
- Order creation
- Online payment
- Order status management
- Order emails

### Phase 9 — Reports and Admin Controls

- Dashboard charts
- Revenue reports
- Staff reports
- Product reports
- Appointment reports
- Refund and discount reports
- Notification logs
- Audit logs

### Phase 10 — Deployment

- Production environment variables
- Azure deployment
- Database migration
- Blob storage
- Production email provider
- Production payment provider
- Logging
- Backup plan
- Final testing

---

## 27. First Minimum Viable Product

The first working version must include:

1. Email login
2. Customer registration
3. Email verification
4. Forgot password
5. Role-based dashboards
6. Admin user management
7. Service management
8. Staff management
9. Service assignment to stylists
10. Staff schedules
11. Customer stylist selection
12. Appointment slot calculation
13. Appointment booking
14. Appointment confirmation email
15. Appointment queue
16. Staff appointment status updates
17. Basic POS
18. Cash/card payment recording
19. Product management
20. Stock deduction
21. Basic reports

Add the full online shop, advanced payment gateway, and advanced reports after the MVP is stable.

---

## 28. Definition of Done

A feature is complete only when:

- Backend API works
- Frontend page works
- Validation is included
- Role permissions are enforced
- Error handling is included
- Relevant database changes are included
- Relevant email or notification behavior is included
- Tests pass
- No console errors remain
- Responsive layout is checked
- Documentation is updated
- `TASK_PROGRESS.md` is updated

---

## 29. `TASK_PROGRESS.md` Format

Codex should maintain this file.

```markdown
# Task Progress

## Current Phase
Phase 1 — Project Foundation

## Completed
- [x] Created React client
- [x] Created Express server

## In Progress
- [ ] MySQL connection

## Next
- [ ] Create database schema
- [ ] Add error middleware

## Known Issues
- None

## Important Decisions
- JavaScript is used instead of TypeScript.
- Mock payment provider is used during development.
```

---

## 30. First Instruction to Codex

Use the following as the first Codex task:

```text
Read SALON_MANAGEMENT_SYSTEM_CODEX_MASTER_PLAN.md completely.

Create the project foundation using:
- React + Vite + JavaScript + Tailwind CSS
- Node.js + Express.js + JavaScript
- MySQL

Create the recommended folder structure, environment example files, README.md,
TASK_PROGRESS.md, database/schema.sql, and database/seed.sql.

Then implement Phase 1 only:
- Server configuration
- MySQL connection
- Standard API response utilities
- Central error handling
- Basic request validation setup
- CORS
- Helmet
- Rate limiting
- React routing
- Public layout
- Role dashboard placeholder layouts
- Health-check endpoint

Do not start appointment, payment, or inventory features yet.

After implementation:
1. Run both frontend and backend.
2. Fix all errors.
3. Show the final folder structure.
4. Explain how to configure MySQL.
5. Update TASK_PROGRESS.md.
```

---

## 31. Future Enhancements

After the core system is complete, optional features can include:

- Multiple salon branches
- SMS and WhatsApp notifications
- Customer loyalty points
- Gift vouchers
- Membership packages
- Staff commission calculation
- Product supplier management
- Barcode scanning
- QR-code receipts
- Customer reviews
- AI appointment assistant
- Mobile application
- Sinhala and Tamil language support

---

## 32. Final Product Summary

The final Salon Management System will provide one platform for:

- Customer appointment booking
- Preferred stylist selection
- Staff schedule management
- Live appointment queue
- Walk-in POS billing
- Product sales
- Online orders
- Cash, card, and online payments
- Email verification and password reset
- Appointment and payment confirmations
- Inventory management
- User management
- Business reporting

The system must remain secure, maintainable, responsive, and easy to extend.
