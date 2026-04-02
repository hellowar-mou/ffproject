-- =========================================
-- PROJECT FOODFERRARI - FINAL SCHEMA
-- DB: Oracle
-- =========================================

-- =========================
-- USERS (Supertype)
-- =========================
CREATE TABLE users (
  id            NUMBER        NOT NULL,
  role          VARCHAR2(20)  NOT NULL,
  name          VARCHAR2(120),
  phone         VARCHAR2(40),
  email         VARCHAR2(200) NOT NULL,
  password_hash VARCHAR2(200) NOT NULL,
  created_at    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT pk_users PRIMARY KEY (id),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT ck_users_role CHECK (role IN ('customer','rider','owner','admin'))
);

-- =========================
-- IS_A tables (PK = FK)
-- =========================
CREATE TABLE customers (
  id      NUMBER NOT NULL,
  address VARCHAR2(500),
  CONSTRAINT pk_customers PRIMARY KEY (id),
  CONSTRAINT fk_customers_user
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================
-- CUSTOMER VIEW (inherits users)
-- =========================
CREATE OR REPLACE VIEW customer_details AS
SELECT
  u.id,
  u.role,
  u.name,
  u.phone,
  u.email,
  u.password_hash,
  u.created_at,
  c.address AS customer_address
FROM users u
JOIN customers c ON c.id = u.id
WHERE u.role = 'customer';

CREATE TABLE riders (
  id          NUMBER NOT NULL,
  status      VARCHAR2(30) DEFAULT 'offline',
  current_lat NUMBER(10,7),
  current_lng NUMBER(10,7),
  CONSTRAINT pk_riders PRIMARY KEY (id),
  CONSTRAINT fk_riders_user
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================
-- RIDER VIEW (inherits users)
-- =========================
CREATE OR REPLACE VIEW rider_details AS
SELECT
  u.id,
  u.role,
  u.name,
  u.phone,
  u.email,
  u.password_hash,
  u.created_at,
  r.status,
  r.current_lat,
  r.current_lng
FROM users u
JOIN riders r ON r.id = u.id
WHERE u.role = 'rider';

CREATE TABLE owners (
  id  NUMBER NOT NULL,
  nid VARCHAR2(50),
  CONSTRAINT pk_owners PRIMARY KEY (id),
  CONSTRAINT fk_owners_user
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================
-- OWNER VIEW (inherits users)
-- =========================
CREATE OR REPLACE VIEW owner_details AS
SELECT
  u.id,
  u.role,
  u.name,
  u.phone,
  u.email,
  u.password_hash,
  u.created_at,
  o.nid
FROM users u
JOIN owners o ON o.id = u.id
WHERE u.role = 'owner';

-- =========================
-- AREA + CUSTOMER ADDRESS
-- =========================
CREATE TABLE areas (
  area_id         NUMBER NOT NULL,
  city            VARCHAR2(120),
  zone            VARCHAR2(120),
  roadward        VARCHAR2(120),
  max_distance_km NUMBER(10,2),
  CONSTRAINT pk_areas PRIMARY KEY (area_id)
);

CREATE TABLE customer_addresses (
  address_id  NUMBER NOT NULL,
  customer_id NUMBER NOT NULL,
  area_id     NUMBER,
  description VARCHAR2(500),
  latitude    NUMBER(10,7),
  longitude   NUMBER(10,7),
  CONSTRAINT pk_customer_addresses PRIMARY KEY (address_id),
  CONSTRAINT fk_ca_customer FOREIGN KEY (customer_id)
    REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_ca_area FOREIGN KEY (area_id)
    REFERENCES areas(area_id)
);

CREATE TABLE rider_preferences (
  rider_id      NUMBER NOT NULL,
  area_id       NUMBER NOT NULL,
  preference_id NUMBER, -- optional: priority/weight
  CONSTRAINT pk_rider_preferences PRIMARY KEY (rider_id, area_id),
  CONSTRAINT fk_rpref_rider FOREIGN KEY (rider_id)
    REFERENCES riders(id) ON DELETE CASCADE,
  CONSTRAINT fk_rpref_area FOREIGN KEY (area_id)
    REFERENCES areas(area_id) ON DELETE CASCADE
);


-- =========================
-- RESTAURANT SIDE
-- =========================
CREATE TABLE restaurants (
  id          NUMBER NOT NULL,
  owner_id    NUMBER NOT NULL,
  name        VARCHAR2(200),
  description VARCHAR2(2000),
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP,
  CONSTRAINT pk_restaurants PRIMARY KEY (id),
  CONSTRAINT fk_rest_owner FOREIGN KEY (owner_id)
    REFERENCES owners(id)
);

CREATE TABLE cuisines (
  cuisine_id NUMBER NOT NULL,
  name       VARCHAR2(120),
  CONSTRAINT pk_cuisines PRIMARY KEY (cuisine_id),
  CONSTRAINT uq_cuisine_name UNIQUE (name)
);

CREATE TABLE restaurant_cuisines (
  restaurant_id NUMBER NOT NULL,
  cuisine_id    NUMBER NOT NULL,
  CONSTRAINT pk_rest_cuisine PRIMARY KEY (restaurant_id, cuisine_id),
  CONSTRAINT fk_rc_rest FOREIGN KEY (restaurant_id)
    REFERENCES restaurants(id) ON DELETE CASCADE,
  CONSTRAINT fk_rc_cuisine FOREIGN KEY (cuisine_id)
    REFERENCES cuisines(cuisine_id) ON DELETE CASCADE
);

CREATE TABLE restaurant_branches (
  branch_id     NUMBER NOT NULL,
  restaurant_id NUMBER NOT NULL,
  status        VARCHAR2(30),
  CONSTRAINT pk_rest_branches PRIMARY KEY (branch_id),
  CONSTRAINT fk_rb_rest FOREIGN KEY (restaurant_id)
    REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE TABLE restaurant_branch_addresses (
  br_add_id   NUMBER NOT NULL,
  branch_id   NUMBER NOT NULL,
  current_lat NUMBER(10,7),
  current_lng NUMBER(10,7),
  CONSTRAINT pk_branch_address PRIMARY KEY (br_add_id),
  CONSTRAINT fk_ba_branch FOREIGN KEY (branch_id)
    REFERENCES restaurant_branches(branch_id) ON DELETE CASCADE
);

CREATE TABLE food_items (
  food_id      NUMBER NOT NULL,
  branch_id    NUMBER NOT NULL,
  cuisine_id   NUMBER,
  name         VARCHAR2(200),
  price        NUMBER(10,2),
  availability NUMBER(1),
  image_path   VARCHAR2(500),
  CONSTRAINT pk_food_items PRIMARY KEY (food_id),
  CONSTRAINT fk_fi_branch FOREIGN KEY (branch_id)
    REFERENCES restaurant_branches(branch_id) ON DELETE CASCADE,
  CONSTRAINT fk_fi_cuisine FOREIGN KEY (cuisine_id)
    REFERENCES cuisines(cuisine_id)
);

-- =========================
-- ORDERS
-- =========================
CREATE TABLE orders (
  order_id     NUMBER NOT NULL,
  customer_id  NUMBER NOT NULL,
  address_id   NUMBER,
  status       VARCHAR2(30),
  subtotal     NUMBER(12,2),
  delivery_fee NUMBER(12,2),
  total        NUMBER(12,2),
  placed_at    TIMESTAMP DEFAULT SYSTIMESTAMP,
  CONSTRAINT pk_orders PRIMARY KEY (order_id),
  CONSTRAINT fk_ord_customer FOREIGN KEY (customer_id)
    REFERENCES customers(id),
  CONSTRAINT fk_ord_address FOREIGN KEY (address_id)
    REFERENCES customer_addresses(address_id)
);

CREATE TABLE order_items (
  order_id      NUMBER NOT NULL,
  food_id       NUMBER NOT NULL,
  quantity      NUMBER,
  updated_price NUMBER(10,2),
  CONSTRAINT pk_order_items PRIMARY KEY (order_id, food_id),
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id)
    REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_food FOREIGN KEY (food_id)
    REFERENCES food_items(food_id)
);

-- =========================
-- DELIVERY
-- =========================
CREATE TABLE delivery_assignments (
  assign_id     NUMBER NOT NULL,
  order_id      NUMBER NOT NULL,
  rider_id      NUMBER NOT NULL,
  status        VARCHAR2(30),
  accepted_at   TIMESTAMP,
  cancelled_at  TIMESTAMP,
  cancel_reason VARCHAR2(500),
  CONSTRAINT pk_delivery_assignments PRIMARY KEY (assign_id),
  CONSTRAINT fk_da_order FOREIGN KEY (order_id)
    REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_da_rider FOREIGN KEY (rider_id)
    REFERENCES riders(id),
  CONSTRAINT uq_da_order UNIQUE (order_id)
);

CREATE TABLE delivery_tracking (
  tracking_id  NUMBER NOT NULL,
  order_id     NUMBER NOT NULL,
  picked_at    TIMESTAMP,
  delivered_at TIMESTAMP,
  CONSTRAINT pk_delivery_tracking PRIMARY KEY (tracking_id),
  CONSTRAINT fk_dt_order FOREIGN KEY (order_id)
    REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT uq_dt_order UNIQUE (order_id)
);

-- =========================
-- PAYMENT & VOUCHER
-- =========================
CREATE TABLE vouchers (
  voucher_id          NUMBER NOT NULL,
  voucher_code        VARCHAR2(60),
  discount_pct        NUMBER(5,2),
  min_order_amount    NUMBER(10,2),
  max_discount_amount NUMBER(10,2),
  valid_till          DATE,
  CONSTRAINT pk_vouchers PRIMARY KEY (voucher_id),
  CONSTRAINT uq_voucher_code UNIQUE (voucher_code)
);

CREATE TABLE payments (
  payment_id     NUMBER NOT NULL,
  order_id       NUMBER NOT NULL,
  payment_method VARCHAR2(30),
  status         VARCHAR2(30),
  amount         NUMBER(12,2),
  paid_at        TIMESTAMP,
  CONSTRAINT pk_payments PRIMARY KEY (payment_id),
  CONSTRAINT fk_pay_order FOREIGN KEY (order_id)
    REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT uq_payment_order UNIQUE (order_id)
);

CREATE TABLE order_vouchers (
  order_id       NUMBER NOT NULL,
  voucher_id     NUMBER NOT NULL,
  discount_price NUMBER(10,2),
  CONSTRAINT pk_order_vouchers PRIMARY KEY (order_id, voucher_id),
  CONSTRAINT fk_ov_order FOREIGN KEY (order_id)
    REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_ov_voucher FOREIGN KEY (voucher_id)
    REFERENCES vouchers(voucher_id) ON DELETE CASCADE
);

-- =========================
-- SEQUENCES
-- =========================
CREATE SEQUENCE users_seq START WITH 1;
CREATE SEQUENCE areas_seq START WITH 1;
CREATE SEQUENCE customer_addresses_seq START WITH 1;
CREATE SEQUENCE restaurants_seq START WITH 1;
CREATE SEQUENCE cuisines_seq START WITH 1;
CREATE SEQUENCE restaurant_branches_seq START WITH 1;
CREATE SEQUENCE restaurant_branch_addresses_seq START WITH 1;
CREATE SEQUENCE food_items_seq START WITH 1;
CREATE SEQUENCE orders_seq START WITH 1;
CREATE SEQUENCE delivery_assignments_seq START WITH 1;
CREATE SEQUENCE delivery_tracking_seq START WITH 1;
CREATE SEQUENCE vouchers_seq START WITH 1;
CREATE SEQUENCE payments_seq START WITH 1;
