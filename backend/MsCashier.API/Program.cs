using System.Reflection;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.API.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MsCashier.API.Middleware;
using MsCashier.Application.DependencyInjection;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Application.Services;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Interfaces;
using MsCashier.Infrastructure.Data;
using MsCashier.Infrastructure.Repositories;
using MsCashier.Infrastructure.Services;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;

// Bootstrap logger so startup failures are recorded.
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

// Replace the default logger with Serilog, configured from appsettings + code.
builder.Host.UseSerilog((ctx, services, configuration) => configuration
    .ReadFrom.Configuration(ctx.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithThreadId()
    .Enrich.WithProperty("Application", "MsCashier.API")
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {CorrelationId} {Message:lj}{NewLine}{Exception}")
    .WriteTo.File(
        path: "logs/mscashier-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 14,
        outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} {Level:u3}] {CorrelationId} {Message:lj}{NewLine}{Exception}"));

// ============================================================
// 1. Database
// ============================================================

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "ConnectionStrings:DefaultConnection is REQUIRED. " +
        "Set it via environment variable ConnectionStrings__DefaultConnection or appsettings.{Environment}.json.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        connectionString,
        sqlOptions =>
        {
            // Retry disabled to support manual transactions (BeginTransaction)
            // For production: wrap transactions with CreateExecutionStrategy() pattern
            // sqlOptions.EnableRetryOnFailure(maxRetryCount: 3);
            sqlOptions.CommandTimeout(60);
            sqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.GetName().Name);
        }));

// ============================================================
// 2. Authentication & Authorization
// ============================================================

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "Jwt:Key is REQUIRED. Set it via environment variable Jwt__Key or appsettings.{Environment}.json. " +
        "Must be at least 32 characters. NEVER commit the real key to source control.");
}
if (jwtKey.Length < 32)
{
    throw new InvalidOperationException("Jwt:Key must be at least 32 characters long for HS256.");
}
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MsCashier";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MsCashier";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment(); // HTTPS required in production
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Permission-based authorization (claims placed on the JWT by TokenService).
// Use [RequirePermission("products.delete")] on controller actions.
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();

// ============================================================
// 3. Dependency Injection
// ============================================================

// Data Protection & Encryption
builder.Services.AddDataProtection();
builder.Services.AddScoped<IEncryptionService, EncryptionService>();

// Infrastructure
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<ICurrentTenantService, CurrentTenantService>();
builder.Services.AddScoped<ITokenService, TokenService>();

// Application Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<ITenantModuleService, TenantModuleService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IUnitService, UnitService>();
builder.Services.AddScoped<ISalesRepService, SalesRepService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IPdfService, PdfService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IStoreSettingsService, StoreSettingsService>();
builder.Services.AddScoped<IIntegrationService, IntegrationService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IContactService, ContactService>();

// Accounting / GL
builder.Services
    .AddJournalEngine()
    .AddPostingRules()
    .AddAccountingReports()
    .AddAccountingBackfill();
builder.Services.AddScoped<IWarehouseService, WarehouseService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IStockCountService, StockCountService>();
builder.Services.AddScoped<ICsvImportService, CsvImportService>();
builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();
builder.Services.AddScoped<IProductVariantService, ProductVariantService>();
builder.Services.AddScoped<IFinanceService, FinanceService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IInstallmentService, InstallmentService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IZatcaService, ZatcaService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<IPaymentGatewayService, PaymentGatewayService>();
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddScoped<IEmployeeDetailService, EmployeeDetailService>();
builder.Services.AddScoped<ISalaryConfigService, SalaryConfigService>();
builder.Services.AddScoped<IAttendanceDeviceService, AttendanceDeviceService>();
builder.Services.AddScoped<IAttendanceService, AttendanceManagementService>();
builder.Services.AddScoped<IPayrollService, PayrollManagementService>();
builder.Services.AddScoped<IBranchService, BranchManagementService>();
builder.Services.AddScoped<ITableService, TableService>();
builder.Services.AddScoped<IDineOrderService, DineOrderService>();
builder.Services.AddScoped<IFloorSectionService, FloorSectionService>();
builder.Services.AddScoped<IQrConfigService, QrConfigService>();
builder.Services.AddScoped<ICustomerOrderService, CustomerOrderService>();
builder.Services.AddScoped<IPaymentTerminalService, PaymentTerminalService>();
// Email & SMS
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.Configure<SmsSettings>(builder.Configuration.GetSection("Sms"));
builder.Services.AddScoped<ISmsService, SmsService>();
// Social Media
builder.Services.AddScoped<ISocialMediaService, SocialMediaService>();
// Production & Kitchen
builder.Services.AddScoped<IRecipeService, RecipeService>();
builder.Services.AddScoped<IKitchenStationService, KitchenStationService>();
builder.Services.AddScoped<IProductionOrderService, ProductionOrderService>();
builder.Services.AddScoped<IProductionWasteService, ProductionWasteService>();
// RFID & QR Inventory
builder.Services.AddScoped<IRfidInventoryService, RfidInventoryService>();
// Public API & Webhooks
builder.Services.AddScoped<IPublicApiService, PublicApiService>();
// Demo Data Seeder
builder.Services.AddScoped<IDemoDataSeeder, DemoDataSeeder>();
// Online Store
builder.Services.AddScoped<IOnlineStoreService, OnlineStoreService>();
builder.Services.AddScoped<IStorefrontService, StorefrontService>();
builder.Services.AddHttpClient();

// Background Jobs
builder.Services.AddHostedService<LoyaltyPointsExpiryJob>();
builder.Services.AddHostedService<WebhookRetryJob>();
builder.Services.AddHostedService<SocialMediaSchedulerJob>();
builder.Services.AddHostedService<LowStockAlertJob>();

// ============================================================
// 4. CORS
// ============================================================

var corsOriginsRaw = builder.Configuration["Cors:Origins"];
var corsOrigins = !string.IsNullOrWhiteSpace(corsOriginsRaw)
    ? corsOriginsRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    : Array.Empty<string>();

// CORS + AllowCredentials with wildcard is forbidden by browsers. Enforce it at startup.
if (corsOrigins.Any(o => o == "*"))
{
    throw new InvalidOperationException(
        "Cors:Origins must not include '*' when AllowCredentials is enabled. " +
        "List the exact allowed origins (comma-separated).");
}
if (!builder.Environment.IsDevelopment() && corsOrigins.Length == 0)
{
    throw new InvalidOperationException("Cors:Origins is REQUIRED in non-development environments.");
}
// Fallback only for dev
if (corsOrigins.Length == 0)
{
    corsOrigins = new[] { "http://localhost:3000", "http://localhost:5173" };
}

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ============================================================
// 5. Swagger
// ============================================================

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MPOS API",
        Version = "v1",
        Description = "Multi-tenant Point of Sale system API"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "أدخل رمز JWT الخاص بك — Enter your JWT token"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Include XML documentation comments
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
        options.IncludeXmlComments(xmlPath);
});

// ============================================================
// 5.5. Rate Limiting
// ============================================================

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (ctx, token) =>
    {
        ctx.HttpContext.Response.ContentType = "application/json; charset=utf-8";
        await ctx.HttpContext.Response.WriteAsync(
            "{\"success\":false,\"errors\":[\"عدد المحاولات كبير جداً. حاول بعد قليل.\"]}",
            cancellationToken: token);
    };

    // Strict bucket for authentication endpoints (login, refresh, otp request)
    // Keyed by client IP — 10 attempts per minute.
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    // Global fallback — 200 requests per minute per IP (authenticated APIs).
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 200,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

// ============================================================
// 5.7. OpenTelemetry — traces + metrics
//
// Default exporter is the console (visible alongside Serilog logs). To send
// traces/metrics to a real backend (Jaeger, Tempo, Datadog, Honeycomb, etc.),
// set the standard OTEL env vars:
//   OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector.example.com:4317
//   OTEL_EXPORTER_OTLP_PROTOCOL=grpc
// and the OTLP exporter will pick them up automatically.
// ============================================================

var otlpEndpoint = builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]
                   ?? Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT");

builder.Services.AddOpenTelemetry()
    .ConfigureResource(rb => rb
        .AddService(serviceName: "MsCashier.API", serviceVersion: "1.0.0")
        .AddAttributes(new KeyValuePair<string, object>[]
        {
            new("deployment.environment", builder.Environment.EnvironmentName),
        }))
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation(opts =>
            {
                opts.RecordException = true;
                // Don't trace health probes — they would dominate the trace volume.
                opts.Filter = ctx => ctx.Request.Path != "/health";
            })
            .AddHttpClientInstrumentation()
            .AddSqlClientInstrumentation(opts =>
            {
                opts.SetDbStatementForText = !builder.Environment.IsProduction();
                opts.RecordException = true;
            });

        if (!string.IsNullOrWhiteSpace(otlpEndpoint))
        {
            tracing.AddOtlpExporter();
        }
        else if (builder.Environment.IsDevelopment())
        {
            tracing.AddConsoleExporter();
        }
    })
    .WithMetrics(metrics =>
    {
        metrics
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation();

        if (!string.IsNullOrWhiteSpace(otlpEndpoint))
        {
            metrics.AddOtlpExporter();
        }
    });

// ============================================================
// 6. Controllers & Health Checks
// ============================================================

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

builder.Services.AddResponseCaching();

builder.Services.AddControllers();

builder.Services.AddHealthChecks()
    .AddSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")!,
        name: "sqlserver",
        timeout: TimeSpan.FromSeconds(5));

// ============================================================
// Build
// ============================================================

var app = builder.Build();

// ============================================================
// Middleware Pipeline
// ============================================================

// 0. Correlation IDs (outermost so every log line has one)
app.UseMiddleware<CorrelationIdMiddleware>();

// 0.3 Request/response logging (method, path, status, timing, tenant)
app.UseMiddleware<RequestLoggingMiddleware>();

// 0.5 Serilog HTTP request logging (status, timing, route)
app.UseSerilogRequestLogging();

// 0.6 Response compression (before other content-producing middleware)
app.UseResponseCompression();

// 1. Global exception handler
app.UseMiddleware<ExceptionMiddleware>();

// 2. Swagger (development only)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "MPOS API v1");
        c.RoutePrefix = "swagger";
    });
}

// 3. HTTPS redirection
app.UseHttpsRedirection();

// 3.5 Static files (product images served from wwwroot/)
app.UseStaticFiles();

// 4. CORS
app.UseCors();

// 4.5 Rate limiting (must come before auth so 429 is enforced even on AllowAnonymous)
app.UseRateLimiter();

// 4.6 API key rate limiting for public API endpoints
app.UseMiddleware<ApiKeyRateLimitMiddleware>();

// 4.7 Response caching
app.UseResponseCaching();

// 5. Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// 6. Tenant resolution
app.UseMiddleware<TenantMiddleware>();

// 7. Controllers
app.MapControllers();

// 8. Health checks
app.MapHealthChecks("/health");

// ============================================================
// Migration & Seed
//
// Two modes are supported:
//
//  1. CLI:  `dotnet MsCashier.API.dll --migrate-only`
//     Apply migrations + seed, then exit. Used by the dedicated
//     `migrate` container in docker-compose, run before the API starts.
//     This is the production-recommended pattern.
//
//  2. Auto: When `Database:AutoMigrate` is true (default for backwards
//     compatibility), the API also applies migrations on startup. Set
//     it to false in production once you have a separate migration job.
//
// Seeding is idempotent: it only inserts the SuperAdmin tenant if no
// SuperAdmin row exists yet, so it is safe to run on every deploy.
// ============================================================

var migrateOnly = args.Contains("--migrate-only");
var autoMigrate = builder.Configuration.GetValue<bool>("Database:AutoMigrate", defaultValue: true);

if (migrateOnly || autoMigrate)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        logger.LogInformation("Applying database migrations...");
        await db.Database.MigrateAsync();
        logger.LogInformation("Database migrations applied successfully.");

        // Seed SuperAdmin tenant & user (idempotent — only seeds if missing)
        if (!await db.Tenants.AnyAsync(t => t.Name == "SuperAdmin"))
        {
            logger.LogInformation("Seeding SuperAdmin tenant and user...");

            var tenantId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            var tenant = new Tenant
            {
                Id = tenantId,
                Name = "SuperAdmin",
                BusinessType = "System",
                OwnerName = "System Administrator",
                Phone = "0000000000",
                City = "System",
                PlanId = 3,
                Status = MsCashier.Domain.Enums.TenantStatus.Active,
                SubscriptionStart = DateTime.UtcNow,
                MaxUsers = 999,
                MaxWarehouses = 999,
                MaxPosStations = 999,
                CurrencyCode = "SAR",
                VatNumber = "300000000000003"
            };

            db.Tenants.Add(tenant);

            // SuperAdmin password — configurable via Seed:SuperAdminPassword.
            // In non-development environments an explicit value is REQUIRED to avoid
            // seeding the well-known default into production.
            var seedPassword = builder.Configuration["Seed:SuperAdminPassword"];
            if (string.IsNullOrWhiteSpace(seedPassword))
            {
                if (!app.Environment.IsDevelopment())
                {
                    throw new InvalidOperationException(
                        "Seed:SuperAdminPassword is REQUIRED outside Development. " +
                        "Set it via environment variable Seed__SuperAdminPassword before first run.");
                }
                seedPassword = "Admin@123";
                logger.LogWarning("Using default development SuperAdmin password. DO NOT use in production.");
            }
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(seedPassword);

            var adminUser = new User
            {
                Id = userId,
                TenantId = tenantId,
                Username = "admin",
                PasswordHash = passwordHash,
                FullName = "System Administrator",
                Role = "SuperAdmin",
                IsActive = true
            };

            db.Users.Add(adminUser);

            // Default warehouse
            var warehouse = new Warehouse
            {
                TenantId = tenantId,
                Name = "المخزن الرئيسي",
                Location = "المقر الرئيسي",
                IsMain = true,
                IsActive = true
            };
            db.Warehouses.Add(warehouse);

            // Default finance accounts
            db.FinanceAccounts.Add(new FinanceAccount
            {
                TenantId = tenantId,
                Name = "الصندوق",
                AccountType = MsCashier.Domain.Enums.AccountType.Cash,
                Balance = 0,
                IsActive = true
            });
            db.FinanceAccounts.Add(new FinanceAccount
            {
                TenantId = tenantId,
                Name = "الحساب البنكي",
                AccountType = MsCashier.Domain.Enums.AccountType.Bank,
                Balance = 0,
                IsActive = true
            });

            await db.SaveChangesAsync();

            logger.LogInformation("SuperAdmin tenant ({TenantId}) and user ({UserId}) seeded successfully.", tenantId, userId);
        }

        // ─────────────────────────────────────────────────────────────
        // Auto-backfill Chart of Accounts for any tenant missing it.
        // Idempotent: only fills gaps (skips tenants that already have CoA).
        // Isolated in its own scope + try/catch so a backfill failure
        // does not crash API startup.
        // ─────────────────────────────────────────────────────────────
        try
        {
            using var backfillScope = app.Services.CreateScope();
            var backfillSvc = backfillScope.ServiceProvider
                .GetRequiredService<MsCashier.Application.Interfaces.IAccountingBackfillService>();
            var backfillResult = await backfillSvc.BackfillAllMissingAsync();
            if (backfillResult.IsSuccess && backfillResult.Data is not null)
            {
                var d = backfillResult.Data;
                if (d.TenantsProcessed > 0)
                    logger.LogInformation(
                        "Accounting backfill on startup: {Processed} tenant(s) processed ({Ok} ok, {Fail} failed).",
                        d.TenantsProcessed, d.TenantsSucceeded, d.TenantsFailed);
                else
                    logger.LogInformation("Accounting backfill on startup: no missing tenants — skipped.");
            }
            else
            {
                logger.LogWarning("Accounting backfill on startup returned failure: {Errors}",
                    string.Join("; ", backfillResult.Errors));
            }
        }
        catch (Exception backfillEx)
        {
            logger.LogError(backfillEx, "Accounting backfill on startup threw — continuing boot.");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while migrating or seeding the database.");
        if (migrateOnly)
        {
            // In migrate-only mode, propagate the failure so the container exits non-zero
            // and the deployment pipeline catches it.
            throw;
        }
    }
}

if (migrateOnly)
{
    Log.Information("Migration job completed. Exiting.");
    return;
}

app.Run();

