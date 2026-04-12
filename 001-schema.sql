-- ============================================================
-- MS Cashier - Multi-Tenant POS System
-- Database Schema - SQL Server
-- ============================================================

-- ==================== TENANT MANAGEMENT ====================

CREATE TABLE Tenants (
    Id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Name            NVARCHAR(200)    NOT NULL,
    BusinessType    NVARCHAR(100)    NOT NULL,       -- ملابس، موبايلات، حلويات...
    OwnerName       NVARCHAR(200)    NOT NULL,
    Phone           NVARCHAR(20)     NOT NULL,
    Email           NVARCHAR(200)    NULL,
    Address         NVARCHAR(500)    NULL,
    City            NVARCHAR(100)    DEFAULT N'الإسكندرية',
    LogoUrl         NVARCHAR(500)    NULL,
    TaxNumber       NVARCHAR(50)     NULL,
    CommercialReg   NVARCHAR(50)     NULL,
    PlanId          INT              NOT NULL DEFAULT 1,
    Status          TINYINT          NOT NULL DEFAULT 1, -- 1=Active, 2=Suspended, 3=Cancelled
    SubscriptionStart DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    SubscriptionEnd   DATETIME2      NULL,
    MaxUsers        INT              NOT NULL DEFAULT 3,
    MaxWarehouses   INT              NOT NULL DEFAULT 1,
    MaxPosStations  INT              NOT NULL DEFAULT 1,
    Settings        NVARCHAR(MAX)    NULL,  -- JSON: currency, tax rate, invoice format...
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2        NULL,
    IsDeleted       BIT              NOT NULL DEFAULT 0
);

CREATE TABLE Plans (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    Name            NVARCHAR(100)    NOT NULL,       -- أساسي، متقدم، احترافي
    MonthlyPrice    DECIMAL(10,2)    NOT NULL,
    YearlyPrice     DECIMAL(10,2)    NULL,
    MaxUsers        INT              NOT NULL,
    MaxWarehouses   INT              NOT NULL,
    MaxPosStations  INT              NOT NULL,
    MaxProducts     INT              NULL,            -- NULL = unlimited
    Features        NVARCHAR(MAX)    NULL,            -- JSON array of feature flags
    IsActive        BIT              NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

-- ==================== USERS & AUTH ====================

CREATE TABLE Users (
    Id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    Username        NVARCHAR(100)    NOT NULL,
    PasswordHash    NVARCHAR(500)    NOT NULL,
    FullName        NVARCHAR(200)    NOT NULL,
    Phone           NVARCHAR(20)     NULL,
    Email           NVARCHAR(200)    NULL,
    Role            NVARCHAR(50)     NOT NULL DEFAULT 'Cashier', -- Admin, Manager, Cashier, Warehouse
    IsActive        BIT              NOT NULL DEFAULT 1,
    LastLoginAt     DATETIME2        NULL,
    RefreshToken    NVARCHAR(500)    NULL,
    RefreshTokenExpiry DATETIME2     NULL,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2        NULL,
    IsDeleted       BIT              NOT NULL DEFAULT 0,
    CONSTRAINT UQ_Users_Tenant_Username UNIQUE(TenantId, Username)
);

CREATE TABLE UserPermissions (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    UserId          UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    Permission      NVARCHAR(100)    NOT NULL,   -- pos.sell, inventory.edit, reports.view...
    IsGranted       BIT              NOT NULL DEFAULT 1,
    CONSTRAINT UQ_UserPermissions UNIQUE(UserId, Permission)
);

-- ==================== CATEGORIES & PRODUCTS ====================

CREATE TABLE Categories (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    Name            NVARCHAR(200)    NOT NULL,
    ParentId        INT              NULL REFERENCES Categories(Id),
    SortOrder       INT              NOT NULL DEFAULT 0,
    IsActive        BIT              NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    IsDeleted       BIT              NOT NULL DEFAULT 0
);

CREATE TABLE Units (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    Name            NVARCHAR(100)    NOT NULL,       -- قطعة، كرتونة، دسته، كيلو، متر
    Symbol          NVARCHAR(20)     NULL,
    IsBase          BIT              NOT NULL DEFAULT 1,
    BaseUnitId      INT              NULL REFERENCES Units(Id),
    ConversionRate  DECIMAL(18,6)    NULL,            -- 1 كرتونة = 12 قطعة
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE Products (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    Barcode         NVARCHAR(50)     NULL,
    SKU             NVARCHAR(50)     NULL,
    Name            NVARCHAR(300)    NOT NULL,
    Description     NVARCHAR(1000)   NULL,
    CategoryId      INT              NULL REFERENCES Categories(Id),
    UnitId          INT              NULL REFERENCES Units(Id),
    CostPrice       DECIMAL(18,2)    NOT NULL DEFAULT 0,
    RetailPrice     DECIMAL(18,2)    NOT NULL DEFAULT 0,      -- سعر القطاعي
    HalfWholesale   DECIMAL(18,2)    NULL,                     -- نصف جملة
    WholesalePrice  DECIMAL(18,2)    NULL,                     -- جملة
    Price4          DECIMAL(18,2)    NULL,                     -- سعر إضافي (كبير/صغير/وسط)
    MinStock        INT              NOT NULL DEFAULT 0,       -- حد إعادة الطلب
    MaxStock        INT              NULL,
    TaxRate         DECIMAL(5,2)     NULL DEFAULT 0,
    ImageUrl        NVARCHAR(500)    NULL,
    IsActive        BIT              NOT NULL DEFAULT 1,
    TrackInventory  BIT              NOT NULL DEFAULT 1,
    AllowNegativeStock BIT           NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2        NULL,
    IsDeleted       BIT              NOT NULL DEFAULT 0,
    CONSTRAINT UQ_Products_Tenant_Barcode UNIQUE(TenantId, Barcode)
);

CREATE INDEX IX_Products_TenantId ON Products(TenantId) WHERE IsDeleted = 0;
CREATE INDEX IX_Products_Barcode ON Products(TenantId, Barcode) WHERE IsDeleted = 0;
CREATE INDEX IX_Products_Category ON Products(TenantId, CategoryId) WHERE IsDeleted = 0;

-- ==================== WAREHOUSES & INVENTORY ====================

CREATE TABLE Warehouses (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    Name            NVARCHAR(200)    NOT NULL,
    Location        NVARCHAR(500)    NULL,
    IsMain          BIT              NOT NULL DEFAULT 0,
    IsActive        BIT              NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    IsDeleted       BIT              NOT NULL DEFAULT 0
);

CREATE TABLE Inventory (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    ProductId       INT              NOT NULL REFERENCES Products(Id),
    WarehouseId     INT              NOT NULL REFERENCES Warehouses(Id),
    Quantity        DECIMAL(18,3)    NOT NULL DEFAULT 0,
    ReservedQty     DECIMAL(18,3)    NOT NULL DEFAULT 0,
    LastUpdated     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Inventory UNIQUE(TenantId, ProductId, WarehouseId)
);

CREATE INDEX IX_Inventory_Product ON Inventory(TenantId, ProductId);

CREATE TABLE InventoryTransactions (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    ProductId       INT              NOT NULL REFERENCES Products(Id),
    WarehouseId     INT              NOT NULL REFERENCES Warehouses(Id),
    TransactionType TINYINT          NOT NULL, -- 1=StockIn, 2=StockOut, 3=Transfer, 4=Adjustment, 5=Return
    Quantity        DECIMAL(18,3)    NOT NULL,
    PreviousQty     DECIMAL(18,3)    NOT NULL,
    NewQty          DECIMAL(18,3)    NOT NULL,
    ReferenceType   NVARCHAR(50)     NULL,   -- Sale, Purchase, Transfer, Adjustment
    ReferenceId     NVARCHAR(50)     NULL,
    Notes           NVARCHAR(500)    NULL,
    CreatedBy       UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE StockTransfers (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    TransferNumber  NVARCHAR(50)     NOT NULL,
    FromWarehouseId INT              NOT NULL REFERENCES Warehouses(Id),
    ToWarehouseId   INT              NOT NULL REFERENCES Warehouses(Id),
    Status          TINYINT          NOT NULL DEFAULT 1, -- 1=Pending, 2=Completed, 3=Cancelled
    Notes           NVARCHAR(500)    NULL,
    CreatedBy       UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    ApprovedBy      UNIQUEIDENTIFIER NULL REFERENCES Users(Id),
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CompletedAt     DATETIME2        NULL
);

CREATE TABLE StockTransferItems (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    TransferId      INT              NOT NULL REFERENCES StockTransfers(Id),
    ProductId       INT              NOT NULL REFERENCES Products(Id),
    Quantity        DECIMAL(18,3)    NOT NULL,
    ReceivedQty     DECIMAL(18,3)    NULL
);

-- ==================== CUSTOMERS & SUPPLIERS ====================

CREATE TABLE Contacts (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    ContactType     TINYINT          NOT NULL, -- 1=Customer, 2=Supplier, 3=Both
    Name            NVARCHAR(200)    NOT NULL,
    Phone           NVARCHAR(20)     NULL,
    Phone2          NVARCHAR(20)     NULL,
    Email           NVARCHAR(200)    NULL,
    Address         NVARCHAR(500)    NULL,
    TaxNumber       NVARCHAR(50)     NULL,
    PriceType       TINYINT          NOT NULL DEFAULT 1, -- 1=Retail, 2=HalfWholesale, 3=Wholesale
    CreditLimit     DECIMAL(18,2)    NULL,
    Balance         DECIMAL(18,2)    NOT NULL DEFAULT 0,  -- +ve = owes us, -ve = we owe
    Notes           NVARCHAR(500)    NULL,
    IsActive        BIT              NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2        NULL,
    IsDeleted       BIT              NOT NULL DEFAULT 0
);

CREATE INDEX IX_Contacts_Tenant ON Contacts(TenantId, ContactType) WHERE IsDeleted = 0;

-- ==================== SALES ====================

CREATE TABLE Invoices (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    InvoiceNumber   NVARCHAR(50)     NOT NULL,
    InvoiceType     TINYINT          NOT NULL DEFAULT 1, -- 1=Sale, 2=SaleReturn, 3=Purchase, 4=PurchaseReturn
    InvoiceDate     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    ContactId       INT              NULL REFERENCES Contacts(Id),
    WarehouseId     INT              NOT NULL REFERENCES Warehouses(Id),
    PriceType       TINYINT          NOT NULL DEFAULT 1, -- 1=Retail, 2=Half, 3=Wholesale
    SubTotal        DECIMAL(18,2)    NOT NULL DEFAULT 0,
    DiscountAmount  DECIMAL(18,2)    NOT NULL DEFAULT 0,
    DiscountPercent DECIMAL(5,2)     NULL,
    TaxAmount       DECIMAL(18,2)    NOT NULL DEFAULT 0,
    TotalAmount     DECIMAL(18,2)    NOT NULL DEFAULT 0,
    PaidAmount      DECIMAL(18,2)    NOT NULL DEFAULT 0,
    DueAmount       DECIMAL(18,2)    NOT NULL DEFAULT 0,
    PaymentMethod   TINYINT          NOT NULL DEFAULT 1, -- 1=Cash, 2=Visa, 3=Instapay, 4=Credit, 5=Installment
    PaymentStatus   TINYINT          NOT NULL DEFAULT 1, -- 1=Paid, 2=Partial, 3=Unpaid
    Notes           NVARCHAR(500)    NULL,
    CreatedBy       UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2        NULL,
    IsDeleted       BIT              NOT NULL DEFAULT 0,
    CONSTRAINT UQ_Invoices_Number UNIQUE(TenantId, InvoiceNumber, InvoiceType)
);

CREATE INDEX IX_Invoices_Tenant_Date ON Invoices(TenantId, InvoiceDate DESC) WHERE IsDeleted = 0;
CREATE INDEX IX_Invoices_Contact ON Invoices(TenantId, ContactId) WHERE IsDeleted = 0;

CREATE TABLE InvoiceItems (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    InvoiceId       BIGINT           NOT NULL REFERENCES Invoices(Id),
    ProductId       INT              NOT NULL REFERENCES Products(Id),
    Quantity        DECIMAL(18,3)    NOT NULL,
    UnitPrice       DECIMAL(18,2)    NOT NULL,
    CostPrice       DECIMAL(18,2)    NOT NULL DEFAULT 0,
    DiscountAmount  DECIMAL(18,2)    NOT NULL DEFAULT 0,
    TaxAmount       DECIMAL(18,2)    NOT NULL DEFAULT 0,
    TotalPrice      DECIMAL(18,2)    NOT NULL,
    Notes           NVARCHAR(200)    NULL
);

CREATE INDEX IX_InvoiceItems_Invoice ON InvoiceItems(InvoiceId);

-- ==================== INSTALLMENTS ====================

CREATE TABLE Installments (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    InvoiceId       BIGINT           NOT NULL REFERENCES Invoices(Id),
    ContactId       INT              NOT NULL REFERENCES Contacts(Id),
    TotalAmount     DECIMAL(18,2)    NOT NULL,
    DownPayment     DECIMAL(18,2)    NOT NULL DEFAULT 0,
    NumberOfPayments INT             NOT NULL,
    PaymentAmount   DECIMAL(18,2)    NOT NULL,
    StartDate       DATE             NOT NULL,
    Status          TINYINT          NOT NULL DEFAULT 1, -- 1=Active, 2=Completed, 3=Overdue, 4=Cancelled
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE InstallmentPayments (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    InstallmentId   INT              NOT NULL REFERENCES Installments(Id),
    PaymentNumber   INT              NOT NULL,
    DueDate         DATE             NOT NULL,
    Amount          DECIMAL(18,2)    NOT NULL,
    PaidAmount      DECIMAL(18,2)    NOT NULL DEFAULT 0,
    PaidDate        DATE             NULL,
    Status          TINYINT          NOT NULL DEFAULT 1, -- 1=Pending, 2=Paid, 3=Partial, 4=Overdue
    Notes           NVARCHAR(200)    NULL
);

-- ==================== FINANCE ====================

CREATE TABLE FinanceAccounts (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    Name            NVARCHAR(200)    NOT NULL,       -- خزينة كاش، حساب فيزا، انستاباي
    AccountType     TINYINT          NOT NULL,        -- 1=Cash, 2=Bank, 3=Digital
    Balance         DECIMAL(18,2)    NOT NULL DEFAULT 0,
    IsActive        BIT              NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE FinanceTransactions (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    AccountId       INT              NOT NULL REFERENCES FinanceAccounts(Id),
    TransactionType TINYINT          NOT NULL, -- 1=Income, 2=Expense, 3=Transfer
    Category        NVARCHAR(100)    NULL,    -- إيجار، كهرباء، رواتب، مبيعات...
    Amount          DECIMAL(18,2)    NOT NULL,
    BalanceBefore   DECIMAL(18,2)    NOT NULL,
    BalanceAfter    DECIMAL(18,2)    NOT NULL,
    Description     NVARCHAR(500)    NULL,
    ReferenceType   NVARCHAR(50)     NULL,
    ReferenceId     NVARCHAR(50)     NULL,
    CreatedBy       UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX IX_FinanceTransactions_Tenant ON FinanceTransactions(TenantId, CreatedAt DESC);

-- ==================== EMPLOYEES ====================

CREATE TABLE Employees (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    UserId          UNIQUEIDENTIFIER NULL REFERENCES Users(Id),
    Name            NVARCHAR(200)    NOT NULL,
    Phone           NVARCHAR(20)     NULL,
    NationalId      NVARCHAR(20)     NULL,
    Position        NVARCHAR(100)    NULL,
    Department      NVARCHAR(100)    NULL,
    BasicSalary     DECIMAL(18,2)    NOT NULL DEFAULT 0,
    HireDate        DATE             NOT NULL,
    IsActive        BIT              NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    IsDeleted       BIT              NOT NULL DEFAULT 0
);

CREATE TABLE Attendance (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    EmployeeId      INT              NOT NULL REFERENCES Employees(Id),
    AttendanceDate  DATE             NOT NULL,
    CheckIn         TIME             NULL,
    CheckOut        TIME             NULL,
    Status          TINYINT          NOT NULL DEFAULT 1, -- 1=Present, 2=Absent, 3=Late, 4=Leave
    Notes           NVARCHAR(200)    NULL,
    CONSTRAINT UQ_Attendance UNIQUE(EmployeeId, AttendanceDate)
);

CREATE TABLE Payroll (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL REFERENCES Tenants(Id),
    EmployeeId      INT              NOT NULL REFERENCES Employees(Id),
    Month           INT              NOT NULL,
    Year            INT              NOT NULL,
    BasicSalary     DECIMAL(18,2)    NOT NULL,
    Allowances      DECIMAL(18,2)    NOT NULL DEFAULT 0,
    Deductions      DECIMAL(18,2)    NOT NULL DEFAULT 0,
    Bonus           DECIMAL(18,2)    NOT NULL DEFAULT 0,
    NetSalary       DECIMAL(18,2)    NOT NULL,
    IsPaid          BIT              NOT NULL DEFAULT 0,
    PaidDate        DATE             NULL,
    Notes           NVARCHAR(200)    NULL,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Payroll UNIQUE(EmployeeId, Month, Year)
);

-- ==================== AUDIT LOG ====================

CREATE TABLE AuditLogs (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId        UNIQUEIDENTIFIER NOT NULL,
    UserId          UNIQUEIDENTIFIER NULL,
    Action          NVARCHAR(100)    NOT NULL,
    EntityType      NVARCHAR(100)    NOT NULL,
    EntityId        NVARCHAR(50)     NULL,
    OldValues       NVARCHAR(MAX)    NULL,
    NewValues       NVARCHAR(MAX)    NULL,
    IpAddress       NVARCHAR(50)     NULL,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX IX_AuditLogs_Tenant ON AuditLogs(TenantId, CreatedAt DESC);

-- ==================== SEED DATA ====================

INSERT INTO Plans (Name, MonthlyPrice, YearlyPrice, MaxUsers, MaxWarehouses, MaxPosStations, Features) VALUES
(N'أساسي',    1400, 14000, 3,  1, 1, N'["pos","inventory","basic_reports"]'),
(N'متقدم',    2800, 28000, 10, 3, 3, N'["pos","inventory","advanced_reports","installments","multi_warehouse"]'),
(N'احترافي',  4200, 42000, 99, 99, 99, N'["pos","inventory","all_reports","installments","multi_warehouse","api","custom_branding"]');

GO

-- ==================== STORED PROCEDURES ====================

-- Get Dashboard Stats
CREATE OR ALTER PROCEDURE sp_GetDashboardStats
    @TenantId UNIQUEIDENTIFIER,
    @DateFrom DATETIME2,
    @DateTo   DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    -- Sales summary
    SELECT 
        COUNT(*)                    AS TotalInvoices,
        ISNULL(SUM(TotalAmount),0)  AS TotalSales,
        ISNULL(SUM(PaidAmount),0)   AS TotalCollected,
        ISNULL(SUM(DueAmount),0)    AS TotalDue
    FROM Invoices
    WHERE TenantId = @TenantId 
      AND InvoiceType = 1 
      AND IsDeleted = 0
      AND InvoiceDate BETWEEN @DateFrom AND @DateTo;

    -- Profit calculation
    SELECT 
        ISNULL(SUM(ii.TotalPrice - (ii.CostPrice * ii.Quantity)), 0) AS GrossProfit
    FROM InvoiceItems ii
    JOIN Invoices i ON ii.InvoiceId = i.Id
    WHERE i.TenantId = @TenantId 
      AND i.InvoiceType = 1 
      AND i.IsDeleted = 0
      AND i.InvoiceDate BETWEEN @DateFrom AND @DateTo;

    -- Low stock items
    SELECT p.Id, p.Name, p.Barcode, inv.Quantity, p.MinStock, p.RetailPrice
    FROM Products p
    JOIN Inventory inv ON p.Id = inv.ProductId
    WHERE p.TenantId = @TenantId 
      AND p.IsDeleted = 0 
      AND p.TrackInventory = 1
      AND inv.Quantity <= p.MinStock;

    -- Top selling products
    SELECT TOP 10
        p.Id, p.Name,
        SUM(ii.Quantity)   AS TotalQty,
        SUM(ii.TotalPrice) AS TotalRevenue
    FROM InvoiceItems ii
    JOIN Invoices i ON ii.InvoiceId = i.Id
    JOIN Products p ON ii.ProductId = p.Id
    WHERE i.TenantId = @TenantId 
      AND i.InvoiceType = 1 
      AND i.IsDeleted = 0
      AND i.InvoiceDate BETWEEN @DateFrom AND @DateTo
    GROUP BY p.Id, p.Name
    ORDER BY SUM(ii.Quantity) DESC;
END
GO

-- Create Sale Invoice
CREATE OR ALTER PROCEDURE sp_CreateSaleInvoice
    @TenantId       UNIQUEIDENTIFIER,
    @ContactId      INT = NULL,
    @WarehouseId    INT,
    @PriceType      TINYINT = 1,
    @PaymentMethod  TINYINT = 1,
    @DiscountAmount DECIMAL(18,2) = 0,
    @PaidAmount     DECIMAL(18,2),
    @Notes          NVARCHAR(500) = NULL,
    @CreatedBy      UNIQUEIDENTIFIER,
    @Items          NVARCHAR(MAX),  -- JSON array: [{productId, quantity, unitPrice, discount}]
    @NewInvoiceId   BIGINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Generate invoice number
        DECLARE @InvoiceNumber NVARCHAR(50);
        DECLARE @Count INT;
        SELECT @Count = COUNT(*) + 1 FROM Invoices WHERE TenantId = @TenantId AND InvoiceType = 1;
        SET @InvoiceNumber = 'INV-' + RIGHT('000000' + CAST(@Count AS NVARCHAR), 6);

        -- Calculate totals from items
        DECLARE @SubTotal DECIMAL(18,2) = 0;
        DECLARE @TaxTotal DECIMAL(18,2) = 0;

        -- Insert invoice
        INSERT INTO Invoices (TenantId, InvoiceNumber, InvoiceType, ContactId, WarehouseId, PriceType,
                              SubTotal, DiscountAmount, TaxAmount, TotalAmount, PaidAmount, DueAmount,
                              PaymentMethod, PaymentStatus, Notes, CreatedBy)
        VALUES (@TenantId, @InvoiceNumber, 1, @ContactId, @WarehouseId, @PriceType,
                0, @DiscountAmount, 0, 0, @PaidAmount, 0,
                @PaymentMethod, 1, @Notes, @CreatedBy);

        SET @NewInvoiceId = SCOPE_IDENTITY();

        -- Insert items from JSON
        INSERT INTO InvoiceItems (InvoiceId, ProductId, Quantity, UnitPrice, CostPrice, DiscountAmount, TotalPrice)
        SELECT 
            @NewInvoiceId,
            JSON_VALUE(j.value, '$.productId'),
            JSON_VALUE(j.value, '$.quantity'),
            JSON_VALUE(j.value, '$.unitPrice'),
            p.CostPrice,
            ISNULL(JSON_VALUE(j.value, '$.discount'), 0),
            (CAST(JSON_VALUE(j.value, '$.quantity') AS DECIMAL(18,3)) * CAST(JSON_VALUE(j.value, '$.unitPrice') AS DECIMAL(18,2)))
            - ISNULL(CAST(JSON_VALUE(j.value, '$.discount') AS DECIMAL(18,2)), 0)
        FROM OPENJSON(@Items) j
        JOIN Products p ON p.Id = CAST(JSON_VALUE(j.value, '$.productId') AS INT);

        -- Update inventory
        UPDATE inv SET 
            inv.Quantity = inv.Quantity - CAST(JSON_VALUE(j.value, '$.quantity') AS DECIMAL(18,3)),
            inv.LastUpdated = GETUTCDATE()
        FROM Inventory inv
        CROSS APPLY OPENJSON(@Items) j
        WHERE inv.ProductId = CAST(JSON_VALUE(j.value, '$.productId') AS INT)
          AND inv.WarehouseId = @WarehouseId
          AND inv.TenantId = @TenantId;

        -- Record inventory transactions
        INSERT INTO InventoryTransactions (TenantId, ProductId, WarehouseId, TransactionType, Quantity, PreviousQty, NewQty, ReferenceType, ReferenceId, CreatedBy)
        SELECT 
            @TenantId,
            CAST(JSON_VALUE(j.value, '$.productId') AS INT),
            @WarehouseId,
            2, -- StockOut
            CAST(JSON_VALUE(j.value, '$.quantity') AS DECIMAL(18,3)),
            inv.Quantity + CAST(JSON_VALUE(j.value, '$.quantity') AS DECIMAL(18,3)),
            inv.Quantity,
            'Sale',
            CAST(@NewInvoiceId AS NVARCHAR(50)),
            @CreatedBy
        FROM OPENJSON(@Items) j
        JOIN Inventory inv ON inv.ProductId = CAST(JSON_VALUE(j.value, '$.productId') AS INT)
                           AND inv.WarehouseId = @WarehouseId AND inv.TenantId = @TenantId;

        -- Update invoice totals
        SELECT @SubTotal = SUM(TotalPrice), @TaxTotal = SUM(TaxAmount) FROM InvoiceItems WHERE InvoiceId = @NewInvoiceId;
        
        DECLARE @Total DECIMAL(18,2) = @SubTotal - @DiscountAmount + @TaxTotal;
        DECLARE @Due DECIMAL(18,2) = @Total - @PaidAmount;
        DECLARE @PaymentStatus TINYINT = CASE WHEN @Due <= 0 THEN 1 WHEN @PaidAmount > 0 THEN 2 ELSE 3 END;

        UPDATE Invoices SET 
            SubTotal = @SubTotal, TaxAmount = @TaxTotal, TotalAmount = @Total,
            DueAmount = @Due, PaymentStatus = @PaymentStatus
        WHERE Id = @NewInvoiceId;

        -- Update customer balance if credit
        IF @ContactId IS NOT NULL AND @Due > 0
        BEGIN
            UPDATE Contacts SET Balance = Balance + @Due, UpdatedAt = GETUTCDATE() WHERE Id = @ContactId;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Financial Report
CREATE OR ALTER PROCEDURE sp_GetFinancialReport
    @TenantId UNIQUEIDENTIFIER,
    @DateFrom DATETIME2,
    @DateTo   DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    -- Revenue by payment method
    SELECT 
        PaymentMethod,
        COUNT(*)                   AS InvoiceCount,
        SUM(TotalAmount)           AS TotalAmount,
        SUM(PaidAmount)            AS PaidAmount
    FROM Invoices
    WHERE TenantId = @TenantId AND InvoiceType = 1 AND IsDeleted = 0
      AND InvoiceDate BETWEEN @DateFrom AND @DateTo
    GROUP BY PaymentMethod;

    -- Expenses by category
    SELECT 
        Category,
        SUM(Amount) AS TotalAmount,
        COUNT(*)    AS TransactionCount
    FROM FinanceTransactions
    WHERE TenantId = @TenantId AND TransactionType = 2
      AND CreatedAt BETWEEN @DateFrom AND @DateTo
    GROUP BY Category;

    -- Account balances
    SELECT Id, Name, AccountType, Balance
    FROM FinanceAccounts
    WHERE TenantId = @TenantId AND IsActive = 1;

    -- Daily sales trend
    SELECT 
        CAST(InvoiceDate AS DATE) AS SaleDate,
        COUNT(*)                  AS InvoiceCount,
        SUM(TotalAmount)          AS DailyTotal
    FROM Invoices
    WHERE TenantId = @TenantId AND InvoiceType = 1 AND IsDeleted = 0
      AND InvoiceDate BETWEEN @DateFrom AND @DateTo
    GROUP BY CAST(InvoiceDate AS DATE)
    ORDER BY SaleDate;
END
GO
