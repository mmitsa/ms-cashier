<div align="center">

# MPOS

### The Most Complete Point of Sale System for Your Business
### نظام نقاط البيع الأكثر تكاملاً للأعمال التجارية

A multi-tenant SaaS POS platform for retail, restaurants & multi-branch businesses — built with **.NET 8 + React + SQL Server**

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-2022-CC2927?logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![i18n](https://img.shields.io/badge/i18n-AR%20%7C%20EN-green)](.)

</div>

---

## Screenshots

### Landing Page — English (LTR) & Arabic (RTL)

<table>
<tr>
<td width="50%">
<img src="screenshots/01-hero-en.png" alt="Hero - English" />
<p align="center"><em>English — auto-detected from browser</em></p>
</td>
<td width="50%">
<img src="screenshots/03-hero-ar.png" alt="Hero - Arabic" />
<p align="center"><em>Arabic — RTL layout</em></p>
</td>
</tr>
</table>

### Admin Console — Light & Dark Mode

<table>
<tr>
<td width="50%">
<img src="screenshots/04-dashboard-light.png" alt="Dashboard - Light" />
<p align="center"><em>Dashboard — Light Mode</em></p>
</td>
<td width="50%">
<img src="screenshots/05-dashboard-dark.png" alt="Dashboard - Dark" />
<p align="center"><em>Dashboard — Dark Mode</em></p>
</td>
</tr>
<tr>
<td width="50%">
<img src="screenshots/06-sales-dark.png" alt="Sales - Dark" />
<p align="center"><em>Sales Management — Dark Mode</em></p>
</td>
<td width="50%">
<img src="screenshots/07-login-en.png" alt="Login - English" />
<p align="center"><em>Login — English</em></p>
</td>
</tr>
</table>

### Features Gallery

<table>
<tr>
<td>
<img src="screenshots/02-features-en.png" alt="Features" />
<p align="center"><em>18 features — Smart POS, Waiter, Kitchen Display, QR Self-Order & more</em></p>
</td>
</tr>
</table>

---

## Key Features

<table>
<tr>
<td width="50%">

### Point of Sale (POS)
- Modern touch interface with barcode scanning
- Automatic tax & discount calculations
- Works offline with auto-sync
- Multiple payment methods (cash, card, Apple Pay, etc.)

### Inventory & Warehouses
- Up to 5 warehouses per store
- Low-stock alerts & inter-warehouse transfers
- 4 price levels per product
- Barcode scanner + digital scale support

### Finance & Reporting
- Multi-account treasury (cash, bank, digital)
- Automatic transaction logging
- 8 report types with CSV export
- Real-time dashboard analytics

</td>
<td width="50%">

### Restaurant Management
- Waiter interface for table orders
- Kitchen Display System (KDS) in real-time
- QR Self-Order for customers
- Floor zones (indoor, outdoor, VIP, bar)

### HR & Payroll
- Fingerprint attendance (ZKTeco)
- Automatic monthly payroll
- Payslip generation & archiving

### E-Invoicing (Global)
- ZATCA (Saudi Arabia) Phase 2 compliant
- Egyptian E-Invoice support
- UAE & Jordan support
- QR Code + XML/JSON formats

</td>
</tr>
</table>

### Additional Features

- **Multi-Language (i18n)** — Arabic & English with auto-detection based on browser locale
- **Dark / Light Mode** — Instant toggle with persistent preference across all 22 screens
- **Grouped Sidebar** — 7 collapsible groups with smooth animation & localStorage persistence
- **Multi-Branch** — Add branches with flexible plans, shared or separate products
- **Granular Permissions** — Role-based + permission-based access control per screen
- **Multi-Tenant SaaS** — Complete data isolation between stores with centralized admin

---

## Architecture

```
mpos/
├── backend/
│   ├── MsCashier.Domain/           # Entities & contracts
│   ├── MsCashier.Application/      # Business logic (Services + DTOs)
│   ├── MsCashier.Infrastructure/   # Database (EF Core + Repositories)
│   └── MsCashier.API/              # REST API (15+ Controllers)
├── frontend/
│   ├── src/
│   │   ├── app/                    # App.tsx — routing & layout
│   │   ├── components/layout/      # Sidebar (grouped) + Header (theme toggle)
│   │   ├── features/               # 24 screens (Dashboard, POS, Inventory...)
│   │   ├── store/                  # Zustand (Auth, UI with persist)
│   │   ├── lib/i18n/               # AR + EN translations with auto-detect
│   │   ├── lib/permissions/        # Role + Permission system
│   │   ├── lib/offline/            # IndexedDB + Service Worker sync
│   │   └── styles/                 # Tailwind globals + Dark mode
│   └── tailwind.config.js
├── database/
│   └── 001-schema.sql              # Full database schema
├── docker-compose.yml
└── Dockerfile
```

## Modules (24 Screens)

| Group | Screens | Description |
|-------|---------|-------------|
| **Main** | Dashboard, POS | Real-time stats + smart cashier with barcode & 4 payment methods |
| **Sales & Inventory** | Sales, Inventory, Warehouses, Units, Customers, Sales Reps | Invoices with installments & returns + multi-warehouse stock management |
| **Restaurant** | Floor Plan, Waiter, Kitchen, QR Orders | Table zones + waiter orders + KDS + customer self-ordering |
| **Finance & Reports** | Accounts, Payroll, Payment Terminals, Reports | Multi-account treasury + payroll + payment device integration |
| **HR** | Employees, Attendance | Employee management + fingerprint attendance |
| **Admin** | Branches, Users, Settings | Multi-branch + granular permissions + system settings |
| **System** | Tenants, Subscriptions, Branch Requests | Centralized multi-tenant admin (SuperAdmin only) |

## Multi-Tenant Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  JWT Token  │────>│ TenantMiddleware │────>│ Global Query Filter │
│ (tenant_id) │     │ (extract tenant) │     │ (auto-filter all)   │
└─────────────┘     └──────────────────┘     └─────────────────────┘
```

- **JWT Token** contains `tenant_id` per user
- **TenantMiddleware** extracts tenant from every request
- **Global Query Filters** in EF Core auto-filter all tables
- **SaveChanges Override** auto-assigns TenantId to new entities

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | .NET 8 Web API, Clean Architecture, EF Core |
| **Frontend** | React 18, TypeScript 5, Tailwind CSS 3.4, Zustand, TanStack Query |
| **Database** | SQL Server 2022, Stored Procedures, Migrations |
| **Auth** | JWT + Refresh Token, Role-based + Permission-based |
| **i18n** | Custom zustand-based with auto-detect (AR/EN) |
| **Theming** | Dark/Light with CSS class strategy + zustand persist |
| **Cache** | Redis |
| **Queue** | RabbitMQ (distributed events) |
| **Offline** | IndexedDB + Service Worker + Auto Sync |
| **Container** | Docker + Docker Compose |

## Getting Started

### Docker

```bash
docker-compose up -d
# API: http://localhost:5000
# Frontend: http://localhost:5173
# Swagger: http://localhost:5000/swagger
```

### Manual

```bash
# 1. Backend
cd backend/MsCashier.API
dotnet run

# 2. Frontend
cd frontend
npm install
npm run dev
```

### Default Credentials (Development)

| Username | Password | Role |
|----------|----------|------|
| `admin` | `Admin@123` | SuperAdmin |

## Pricing Plans

| Plan | Price | Users | Warehouses | POS Terminals |
|------|-------|-------|------------|---------------|
| Basic | $49/mo | 3 | 1 | 1 |
| Professional | $99/mo | 10 | 3 | 3 |
| Enterprise | $149/mo | Unlimited | Unlimited | Unlimited |

## API Reference

```
Auth:           POST /auth/login, /auth/refresh
Tenants:        CRUD /admin/tenants (Super Admin)
Products:       CRUD /products, GET /products/barcode/{code}
Categories:     CRUD /categories
Units:          CRUD /units
Invoices:       POST /invoices/sale, /invoices/purchase, /invoices/{id}/return
Contacts:       CRUD /contacts, POST /contacts/{id}/payment
Sales Reps:     CRUD /sales-reps, GET /sales-reps/{id}/commissions
Warehouses:     CRUD /warehouses, POST /warehouses/transfer
Inventory:      GET /inventory/{warehouseId}, POST /inventory/adjust
Finance:        CRUD /finance/accounts, /finance/transactions
Employees:      CRUD /employees, POST /employees/{id}/attendance
Installments:   CRUD /installments, POST /installments/{id}/pay
Dashboard:      GET /dashboard
Reports:        GET /reports/sales, /profit, /inventory, /financial-summary
```

---

<div align="center">

**MPOS** &copy; 2026 — All rights reserved

</div>
