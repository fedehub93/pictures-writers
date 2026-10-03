# Order Management

## Problem Statement

Pictures Writers has a working product catalog (`Product`) but no real order management. The only transactional record today is `Purchase`, which is too thin: it stores only an email, a product id, and a root id. It has no lifecycle state, no amount, no historical price snapshot, no customer entity, no payment records, and no backoffice UI.

As a result the team cannot:

- Create and manage Customers from the admin area.
- Create Orders manually and associate them with Products.
- Mark an offline payment as received and complete an Order.
- Track paid conversions in Google Analytics 4, which leaves a critical gap in the marketing funnel described in `.agents/product-marketing.md` and `.agents/marketing-plan.md`.

The first real flow that must be supported is: a visitor fills a public Form, the system creates a Customer and a pending Order, the business receives an offline payment, and an admin completes the Order. Completing the Order is the canonical business moment that must fire a `purchase` event to GA4 and can start post-purchase Automations.

## Solution

Introduce a generic, backoffice-first order management layer that can later scale to carts, online payments, and post-purchase flows.

The solution adds:

- A `Customer` entity separate from `User` (backoffice identity) and `Contact` (captured email address).
- An `Order` entity with a small but extensible lifecycle, linked to a `Customer`.
- An `orderDate` on `Order` that records the actual date of the sale, editable by an admin, so historical orders keep their real date instead of the import date.
- `OrderItem` rows that keep a price/name snapshot at order time plus an optional reference to the live `Product`.
- A `Payment` entity linked to an `Order`, supporting offline payments now and online methods later.
- Admin list/detail pages for Customers and Orders, protected by granular permissions.
- Permission keys for `customers` and `orders`, including an `orders.manage` permission for completing orders.
- Two new Automation action nodes: `CREATE_CUSTOMER` and `CREATE_ORDER`.
- An internal trigger event `order.completed` fired when an order is completed.
- A GA4 `purchase` event pushed through GTM when an admin completes an order.

## User Stories

1. As an admin, I want to create a Customer with email, name, phone, and billing notes, so that I can keep a record of people who buy outside the public site.
2. As an admin, I want to see a paginated list of all Customers, so that I can search and manage buyers.
3. As an admin, I want to open a Customer detail page and see all their Orders, so that I have a complete history of each buyer.
4. As an admin, I want to create an Order for a Customer and add one or more Products, so that I can record an offline sale.
5. As an admin, I want the Order total to be computed from the current product prices when the Order is created, so that I do not have to calculate it manually.
6. As an admin, I want to see a list of Orders with status and total, so that I can monitor sales.
7. As an admin, I want to open an Order detail page and see its Customer, line items, and Payments, so that I can review the sale.
8. As an admin with the right permission, I want to mark a pending Order as completed after receiving the payment, so that the sale is closed.
9. As an admin with the right permission, I want to cancel an Order, so that I can void a sale that will not happen.
10. As a marketer, I want a GA4 `purchase` event to fire when an admin completes an Order, so that offline conversions become attributable in the funnel.
11. As an automation author, I want a `CREATE_CUSTOMER` node, so that a Form submission can create or update a Customer record.
12. As an automation author, I want a `CREATE_ORDER` node, so that a Form submission can create an Order for the Customer created in the same flow.
13. As an automation author, I want an `order.completed` trigger, so that I can start post-purchase sequences like S3 without custom code.
14. As an admin, I want Orders created from a Form to be distinguishable from Orders created manually, so that I can report by source.
15. As a future developer, I want the Order model to support multiple Payments per Order, so that deposits or partial refunds can be added later without a schema rewrite.
16. As a future developer, I want the `Purchase` model left untouched, so that existing Stripe webhook data remains valid while the new order system is built beside it.
17. As an admin, I want to set the actual date of an Order, so that historical and offline sales appear on the correct day in reporting and exports instead of the day I entered them.

## Implementation Decisions

- **Customer is a separate entity from User and Contact.** A `User` is a backoffice identity with roles. A `Contact` is just an email address captured somewhere. A `Customer` is the commercial buyer; they may have an account later, but in v1 they do not need one. `Customer.userId` is optional and unique so a future link is possible.
- **Customer requires only an email in v1.** Name, phone, billing info, and notes are optional, so a Form submission can create a Customer with minimal data.
- **Order has a minimal but extensible lifecycle.** Status values: `DRAFT`, `PENDING`, `COMPLETED`, `CANCELLED`. Transitions are controlled in a single place so new states can be added safely.
- **Order completion is a manual admin action.** Only a backoffice user with the `orders.manage` permission can move an Order from `PENDING` to `COMPLETED`. The action records `completedAt` and `completedBy`.
- **OrderItem stores a snapshot plus an optional live reference.** Each item stores `nameSnapshot`, `unitPrice`, `quantity`, and `totalPrice`, plus an optional `productId`. If the Product is deleted or its price changes, the Order remains valid.
- **Payment is a separate entity.** One Order can have many Payments. In v1 an offline Order gets one `Payment` with `method=OFFLINE` and `status=PENDING`; completing the Order sets it to `COMPLETED`.
- **Order has a human-readable order number.** Format like `PW-2026-000001`, generated atomically. The UUID remains the primary key. The year segment follows `orderDate`, not the wall-clock creation year, so imported/historical orders are numbered in their own year.
- **Order records its actual date separately from its audit timestamps.** `orderDate` is the business date of the sale. It defaults to the creation time but can be set by the admin, so historical orders keep their true date. `createdAt`/`updatedAt` remain the DB audit timestamps and `completedAt` remains the real moment the order was completed.
- **Order tracks its source.** Values: `MANUAL`, `FORM_SUBMISSION`, `AUTOMATION`, `STRIPE`.
- **Existing `Purchase` model is not touched.** It remains legacy data for any future Stripe reactivation.
- **Admin API uses the same tRPC pattern as Posts and Forms.** This keeps authorization, prefetching, and Suspense consistent with the rest of the admin area.
- **Admin UI follows the existing list/detail pattern.** Customers and Orders each get a list page and a detail page under the Shop section.
- **Automation nodes are two separate actions.** `CREATE_CUSTOMER` and `CREATE_ORDER` can be chained or used independently, matching the existing domain-agnostic node pattern.
- **Internal trigger `order.completed` is emitted on completion.** This lets Automations subscribe to the canonical post-purchase moment.
- **GA4 purchase event is fired client-side when the admin completes the Order.** The mutation returns the completed Order, and the admin page pushes the event with transaction id, value, currency, and items. This closes the offline-conversion attribution gap.

### Schema shape

```prisma
enum OrderStatus { DRAFT PENDING COMPLETED CANCELLED }
enum OrderSource { MANUAL FORM_SUBMISSION AUTOMATION STRIPE }
enum PaymentMethod { OFFLINE STRIPE }
enum PaymentStatus { PENDING COMPLETED REFUNDED FAILED }

model Customer {
  id          String    @id @default(uuid())
  email       String    @unique
  name        String?
  phone       String?
  billingInfo Json?
  notes       String?
  userId      String?   @unique
  user        User?     @relation(fields: [userId], references: [id])
  orders      Order[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Order {
  id          String      @id @default(uuid())
  orderNumber String      @unique
  status      OrderStatus @default(DRAFT)
  source      OrderSource @default(MANUAL)
  customerId  String
  customer    Customer    @relation(fields: [customerId], references: [id])
  items       OrderItem[]
  payments    Payment[]
  totalAmount Float
  currency    String      @default("EUR")
  orderDate   DateTime    @default(now())
  notes       String?
  completedAt DateTime?
  completedBy String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model OrderItem {
  id           String   @id @default(uuid())
  orderId      String
  order        Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId    String?
  product      Product? @relation(fields: [productId], references: [id])
  nameSnapshot String
  unitPrice    Float
  quantity     Int      @default(1)
  totalPrice   Float
  metadata     Json?
  createdAt    DateTime @default(now())
}

model Payment {
  id        String        @id @default(uuid())
  orderId   String
  order     Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  method    PaymentMethod @default(OFFLINE)
  status    PaymentStatus @default(PENDING)
  amount    Float
  currency  String        @default("EUR")
  reference String?
  paidAt    DateTime?
  metadata  Json?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}
```

## Testing Decisions

- The project already uses **Vitest** with a dedicated test database configured in `.env.test`. The test runner runs `prisma migrate deploy` against that database before the suite starts.
- This work follows a **TDD approach**: for each ticket, tests are written before the implementation code and must pass before the ticket is considered complete.
- Tests are integration tests against the real test database, following the existing project pattern (`describe`/`it`, `beforeEach` cleanup, direct `db` calls).
- Each ticket defines the seams to test:
  - **Foundation**: verify that permissions are registered and migration applies cleanly.
  - **Customer**: CRUD operations, email uniqueness, optional fields.
  - **Order**: creation, total calculation, status transitions, completion/cancellation semantics, permission enforcement.
  - **Order date**: `orderDate` persists on create, defaults to now, is returned by the read procedures, and drives the order-number year.
  - **Automation nodes**: `CREATE_CUSTOMER` and `CREATE_ORDER` actions produce correct records, and `order.completed` trigger fires on completion.
  - **GA4 event**: the `purchase` payload is built correctly from an Order and its items.
- Manual acceptance remains the final gate for the end-to-end Form → Automation → Order → Complete flow and the GTM event firing in the browser.

## Out of Scope

- Public shopping cart or checkout flow.
- Stripe integration with the new Order model (Stripe is present but not in use).
- Electronic invoicing.
- Physical shipping or fulfillment tracking.
- Customer-facing email notifications at Order creation or completion (existing email flows remain unchanged).
- Partial payments or refunds in the admin UI in v1 (the schema supports them, but the UI does not).
- Dashboard widgets for revenue/statistics.
- Editing `orderDate` on an already-created Order (v1 sets it at creation only).
- Migration of legacy `Purchase` records into Orders.

## Further Notes

- Order completion is the canonical business moment. It must remain the single trigger for GA4 purchase events and post-purchase Automations.
- The GA4 `purchase` event directly addresses the top operational priority in `.agents/marketing-plan.md`: making offline paid conversions attributable.
- `orderDate` is a record/reporting field and does not change when the GA4 `purchase` event fires. GA4 timestamps events at receipt and cannot be backdated beyond 72 hours, so imported historical orders still land on the import date in GA4. Use `orderDate` from the database for accurate historical reporting.
- `Purchase` remains a legacy table. A future migration should be a deliberate, separate effort once the new Order system is stable and Stripe is reactivated.
