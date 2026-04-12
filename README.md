# MS Cashier — نظام مبيعات متعدد المستأجرين

نظام إدارة مبيعات وكاشير شامل يدعم تعدد المستأجرين (Multi-Tenant) مع إدارة مركزية واحدة.
مبني بـ .NET 8 + React + SQL Server.

## 🏗️ هيكل المشروع

```
ms-cashier/
├── src/
│   ├── MsCashier.Domain/           # الكيانات والعقود
│   │   ├── Common/                 # BaseEntity, Result, PagedResult
│   │   ├── Entities/               # Tenant, Product, Invoice, Contact...
│   │   ├── Enums/                  # PaymentMethod, InvoiceType...
│   │   └── Interfaces/             # IRepository, IUnitOfWork, ITokenService
│   ├── MsCashier.Application/      # منطق الأعمال
│   │   ├── DTOs/                   # Request/Response models
│   │   ├── Interfaces/             # IInvoiceService, IProductService...
│   │   └── Services/               # InvoiceService, ProductService...
│   ├── MsCashier.Infrastructure/   # قاعدة البيانات والخدمات
│   │   ├── Data/                   # AppDbContext مع Query Filters
│   │   ├── Repositories/           # UnitOfWork + Generic Repository
│   │   └── Services/               # TokenService, AuthService...
│   └── MsCashier.API/              # نقاط الوصول
│       ├── Controllers/            # 12 Controller لكل الوحدات
│       ├── Middleware/              # TenantMiddleware, ExceptionMiddleware
│       └── Program.cs              # إعداد التطبيق
├── database/
│   └── 001-schema.sql              # سكيما قاعدة البيانات الكاملة
├── docker-compose.yml              # Docker مع SQL Server + RabbitMQ + Redis
└── Dockerfile                      # Multi-stage build
```

## 📦 الوحدات (Modules)

| الوحدة | الوصف | API Endpoints |
|--------|-------|---------------|
| **نقطة البيع** | شاشة كاشير مع باركود و٤ طرق دفع | `POST /api/v1/invoices/sale` |
| **المخزون** | إدارة أصناف مع ٤ أسعار وتنبيهات | `GET/POST /api/v1/products` |
| **المبيعات** | فواتير مع تقسيط ومرتجعات | `GET /api/v1/invoices/search` |
| **العملاء** | عملاء وموردين مع أرصدة | `GET/POST /api/v1/contacts` |
| **المخازن** | مخازن متعددة مع تحويلات | `POST /api/v1/warehouses/transfer` |
| **الحسابات** | ٣ خزائن (كاش/فيزا/انستاباي) | `GET/POST /api/v1/finance` |
| **الموظفين** | حضور ورواتب ومرتبات | `GET/POST /api/v1/employees` |
| **التقارير** | ٨ أنواع تقارير شاملة | `GET /api/v1/reports/*` |
| **الأقساط** | تقسيط مع متابعة سداد | `GET/POST /api/v1/installments` |
| **المستأجرين** | إدارة مركزية لكل المنشآت | `GET/POST /api/v1/admin/tenants` |

## 🔐 نظام Multi-Tenant

### كيف يعمل العزل بين المستأجرين:

1. **JWT Token** يحتوي على `tenant_id` لكل مستخدم
2. **TenantMiddleware** يستخرج الـ tenant من كل request
3. **Global Query Filters** في EF Core تفلتر كل الجداول تلقائياً بالـ TenantId
4. **SaveChanges Override** يضيف TenantId تلقائياً لكل entity جديد

```csharp
// كل query تلقائياً بيتم فلترتها
modelBuilder.Entity<Product>()
    .HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.TenantId);
```

### خطط الاشتراك:

| الخطة | السعر/شهر | المستخدمين | المخازن | نقاط البيع |
|-------|-----------|-----------|---------|-----------|
| أساسي | ١,٤٠٠ ج.م | ٣ | ١ | ١ |
| متقدم | ٢,٨٠٠ ج.م | ١٠ | ٣ | ٣ |
| احترافي | ٤,٢٠٠ ج.م | غير محدود | غير محدود | غير محدود |

## 🚀 التشغيل

### باستخدام Docker:
```bash
docker-compose up -d
# API: http://localhost:5000
# Swagger: http://localhost:5000/swagger
# RabbitMQ: http://localhost:15672
```

### بدون Docker:
```bash
# 1. تشغيل SQL Server
# 2. تنفيذ database/001-schema.sql
# 3. تشغيل API
cd src/MsCashier.API
dotnet run
```

## 🗄️ قاعدة البيانات

### الجداول الرئيسية (٢٠+ جدول):
- **Tenants** + **Plans** — إدارة المستأجرين والاشتراكات
- **Users** + **UserPermissions** — مستخدمين وصلاحيات
- **Products** + **Categories** + **Units** — الأصناف مع ٤ أسعار بيع
- **Inventory** + **InventoryTransactions** — مخزون مع حركات كاملة
- **Warehouses** + **StockTransfers** — مخازن متعددة مع تحويلات
- **Invoices** + **InvoiceItems** — فواتير بيع ومشتريات ومرتجعات
- **Contacts** — عملاء وموردين مع أرصدة
- **Installments** + **InstallmentPayments** — نظام تقسيط
- **FinanceAccounts** + **FinanceTransactions** — خزائن ومعاملات مالية
- **Employees** + **Attendance** + **Payroll** — موظفين وحضور ورواتب
- **AuditLogs** — سجل مراجعة لكل العمليات

### Stored Procedures:
- `sp_GetDashboardStats` — إحصائيات لوحة التحكم
- `sp_CreateSaleInvoice` — إنشاء فاتورة بيع مع تحديث المخزون والخزينة
- `sp_GetFinancialReport` — التقرير المالي الشامل

## 🔧 التقنيات

- **Backend**: .NET 8 Web API, Clean Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Database**: SQL Server 2022
- **Auth**: JWT + Refresh Token
- **Cache**: Redis
- **Message Queue**: RabbitMQ (للأحداث الموزعة)
- **Container**: Docker + Docker Compose
- **Deployment**: GCP Cloud Run

## 📊 API Endpoints Summary

```
Auth:           POST /auth/login, /auth/refresh
Tenants:        CRUD /admin/tenants (Super Admin)
Products:       CRUD /products, GET /products/barcode/{code}
Categories:     CRUD /categories
Invoices:       POST /invoices/sale, /invoices/purchase, /invoices/{id}/return
Contacts:       CRUD /contacts, POST /contacts/{id}/payment
Warehouses:     CRUD /warehouses, POST /warehouses/transfer
Inventory:      GET /inventory/{warehouseId}, POST /inventory/adjust
Finance:        CRUD /finance/accounts, /finance/transactions
Employees:      CRUD /employees, POST /employees/{id}/attendance
Installments:   CRUD /installments, POST /installments/{id}/pay
Dashboard:      GET /dashboard
Reports:        GET /reports/sales, /profit, /inventory, /financial-summary
```
