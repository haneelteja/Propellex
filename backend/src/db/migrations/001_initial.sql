-- ============================================================
-- Propellex — Initial Schema Migration
-- Run against: propellex database on SQL Server 2022+
-- ============================================================

-- ── Customers ────────────────────────────────────────────────
CREATE TABLE dbo.Customers (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    first_name       NVARCHAR(100)    NOT NULL,
    last_name        NVARCHAR(100)    NOT NULL,
    email            NVARCHAR(255)    NOT NULL,
    phone            NVARCHAR(50)     NULL,
    shipping_address NVARCHAR(500)    NULL,
    total_orders     INT              NOT NULL DEFAULT 0,
    total_spent      DECIMAL(12, 2)   NOT NULL DEFAULT 0,
    created_at       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_Customers PRIMARY KEY (id),
    CONSTRAINT UQ_Customers_Email UNIQUE (email)
);

-- Composite index for list queries with search
CREATE NONCLUSTERED INDEX IX_Customers_Email_Name
    ON dbo.Customers (email, last_name, first_name)
    INCLUDE (id, total_orders, total_spent, created_at);

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE dbo.Products (
    id             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    name           NVARCHAR(255)    NOT NULL,
    sku            NVARCHAR(100)    NOT NULL,
    description    NVARCHAR(MAX)    NULL,
    price          DECIMAL(10, 2)   NOT NULL,
    stock_quantity INT              NOT NULL DEFAULT 0,
    category       NVARCHAR(100)    NOT NULL DEFAULT 'Uncategorized',
    is_active      BIT              NOT NULL DEFAULT 1,
    created_at     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_Products PRIMARY KEY (id),
    CONSTRAINT UQ_Products_SKU UNIQUE (sku),
    CONSTRAINT CK_Products_Price CHECK (price >= 0),
    CONSTRAINT CK_Products_Stock CHECK (stock_quantity >= 0)
);

-- Covering index for product list + category filter
CREATE NONCLUSTERED INDEX IX_Products_Category_Active
    ON dbo.Products (category, is_active, created_at DESC)
    INCLUDE (id, name, sku, price, stock_quantity);

-- Full-text friendly index for name/sku search
CREATE NONCLUSTERED INDEX IX_Products_Name_SKU
    ON dbo.Products (name, sku)
    INCLUDE (id, price, stock_quantity, category, is_active);

-- ── Orders ───────────────────────────────────────────────────
CREATE TABLE dbo.Orders (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    customer_id      UNIQUEIDENTIFIER NOT NULL,
    status           NVARCHAR(50)     NOT NULL DEFAULT 'pending',
    total_amount     DECIMAL(10, 2)   NOT NULL,
    shipping_address NVARCHAR(500)    NOT NULL,
    notes            NVARCHAR(1000)   NULL,
    created_at       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_Orders PRIMARY KEY (id),
    CONSTRAINT FK_Orders_Customer FOREIGN KEY (customer_id) REFERENCES dbo.Customers(id),
    CONSTRAINT CK_Orders_Status CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
    CONSTRAINT CK_Orders_Amount CHECK (total_amount >= 0)
);

-- Keyset pagination + filter by customer + status
CREATE NONCLUSTERED INDEX IX_Orders_Customer_Status_Created
    ON dbo.Orders (customer_id, status, created_at DESC)
    INCLUDE (id, total_amount, shipping_address);

CREATE NONCLUSTERED INDEX IX_Orders_Status_Created
    ON dbo.Orders (status, created_at DESC)
    INCLUDE (id, customer_id, total_amount);

-- ── Order Items ──────────────────────────────────────────────
CREATE TABLE dbo.OrderItems (
    id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    order_id    UNIQUEIDENTIFIER NOT NULL,
    product_id  UNIQUEIDENTIFIER NOT NULL,
    quantity    INT              NOT NULL,
    unit_price  DECIMAL(10, 2)   NOT NULL,
    CONSTRAINT PK_OrderItems PRIMARY KEY (id),
    CONSTRAINT FK_OrderItems_Order   FOREIGN KEY (order_id)   REFERENCES dbo.Orders(id)   ON DELETE CASCADE,
    CONSTRAINT FK_OrderItems_Product FOREIGN KEY (product_id) REFERENCES dbo.Products(id),
    CONSTRAINT CK_OrderItems_Quantity CHECK (quantity > 0)
);

CREATE NONCLUSTERED INDEX IX_OrderItems_Order
    ON dbo.OrderItems (order_id)
    INCLUDE (product_id, quantity, unit_price);
