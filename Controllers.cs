namespace MsCashier.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;

// ==================== BASE CONTROLLER ====================

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public abstract class BaseApiController : ControllerBase
{
    protected IActionResult HandleResult<T>(Domain.Common.Result<T> result)
    {
        if (result.IsSuccess)
            return Ok(new { success = true, data = result.Data, message = result.Message });
        return BadRequest(new { success = false, errors = result.Errors });
    }
}

// ==================== AUTH ====================

[Route("api/v1/auth")]
public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;
    public AuthController(IAuthService authService) => _authService = authService;

    [HttpPost("login"), AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
        => HandleResult(await _authService.LoginAsync(request));

    [HttpPost("refresh"), AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
        => HandleResult(await _authService.RefreshTokenAsync(request));

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = Guid.Parse(User.FindFirst("sub")!.Value);
        return HandleResult(await _authService.ChangePasswordAsync(userId, dto.OldPassword, dto.NewPassword));
    }
}
public record ChangePasswordDto(string OldPassword, string NewPassword);

// ==================== TENANTS (Super Admin) ====================

[Route("api/v1/admin/tenants")]
[Authorize(Roles = "SuperAdmin")]
public class TenantsController : BaseApiController
{
    private readonly ITenantService _service;
    public TenantsController(ITenantService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTenantRequest request)
        => HandleResult(await _service.CreateTenantAsync(request));

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => HandleResult(await _service.GetAllTenantsAsync(page, pageSize));

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
        => HandleResult(await _service.GetTenantAsync(id));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTenantRequest request)
        => HandleResult(await _service.UpdateTenantAsync(id, request));

    [HttpPost("{id}/suspend")]
    public async Task<IActionResult> Suspend(Guid id)
        => HandleResult(await _service.SuspendTenantAsync(id));

    [HttpPost("{id}/activate")]
    public async Task<IActionResult> Activate(Guid id)
        => HandleResult(await _service.ActivateTenantAsync(id));
}

// ==================== PRODUCTS ====================

[Route("api/v1/products")]
public class ProductsController : BaseApiController
{
    private readonly IProductService _service;
    public ProductsController(IProductService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request)
        => HandleResult(await _service.CreateAsync(request));

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] ProductSearchRequest request)
        => HandleResult(await _service.SearchAsync(request));

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
        => HandleResult(await _service.GetByIdAsync(id));

    [HttpGet("barcode/{barcode}")]
    public async Task<IActionResult> GetByBarcode(string barcode)
        => HandleResult(await _service.GetByBarcodeAsync(barcode));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductRequest request)
        => HandleResult(await _service.UpdateAsync(id, request));

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _service.DeleteAsync(id));

    [HttpGet("low-stock")]
    public async Task<IActionResult> LowStock()
        => HandleResult(await _service.GetLowStockAsync());
}

// ==================== CATEGORIES ====================

[Route("api/v1/categories")]
public class CategoriesController : BaseApiController
{
    private readonly ICategoryService _service;
    public CategoriesController(ICategoryService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
        => HandleResult(await _service.CreateAsync(request));

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => HandleResult(await _service.GetAllAsync());

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
        => HandleResult(await _service.DeleteAsync(id));
}

// ==================== INVOICES ====================

[Route("api/v1/invoices")]
public class InvoicesController : BaseApiController
{
    private readonly IInvoiceService _service;
    public InvoicesController(IInvoiceService service) => _service = service;

    [HttpPost("sale")]
    public async Task<IActionResult> CreateSale([FromBody] CreateInvoiceRequest request)
        => HandleResult(await _service.CreateSaleAsync(request));

    [HttpPost("purchase")]
    public async Task<IActionResult> CreatePurchase([FromBody] CreateInvoiceRequest request)
        => HandleResult(await _service.CreatePurchaseAsync(request));

    [HttpPost("{id}/return")]
    public async Task<IActionResult> CreateReturn(long id, [FromBody] List<InvoiceItemRequest> items)
        => HandleResult(await _service.CreateSaleReturnAsync(id, items));

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] InvoiceSearchRequest request)
        => HandleResult(await _service.SearchAsync(request));

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(long id)
        => HandleResult(await _service.GetByIdAsync(id));
}

// ==================== CONTACTS ====================

[Route("api/v1/contacts")]
public class ContactsController : BaseApiController
{
    private readonly IContactService _service;
    public ContactsController(IContactService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContactRequest request)
        => HandleResult(await _service.CreateAsync(request));

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string? search, [FromQuery] int? type,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        => HandleResult(await _service.SearchAsync(search, type, page, pageSize));

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
        => HandleResult(await _service.GetByIdAsync(id));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateContactRequest request)
        => HandleResult(await _service.UpdateAsync(id, request));

    [HttpGet("{id}/balance")]
    public async Task<IActionResult> Balance(int id)
        => HandleResult(await _service.GetBalanceAsync(id));

    [HttpPost("{id}/payment")]
    public async Task<IActionResult> Payment(int id, [FromBody] PaymentDto dto)
        => HandleResult(await _service.RecordPaymentAsync(id, dto.Amount, dto.AccountId));
}
public record PaymentDto(decimal Amount, int AccountId);

// ==================== WAREHOUSES ====================

[Route("api/v1/warehouses")]
public class WarehousesController : BaseApiController
{
    private readonly IWarehouseService _service;
    public WarehousesController(IWarehouseService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseDto dto)
        => HandleResult(await _service.CreateAsync(dto.Name, dto.Location, dto.IsMain));

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => HandleResult(await _service.GetAllAsync());

    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer([FromBody] StockTransferRequest request)
        => HandleResult(await _service.TransferStockAsync(request));
}
public record CreateWarehouseDto(string Name, string? Location, bool IsMain);

// ==================== INVENTORY ====================

[Route("api/v1/inventory")]
public class InventoryController : BaseApiController
{
    private readonly IInventoryService _service;
    public InventoryController(IInventoryService service) => _service = service;

    [HttpGet("{warehouseId}")]
    public async Task<IActionResult> Get(int warehouseId, [FromQuery] string? search)
        => HandleResult(await _service.GetInventoryAsync(warehouseId, search));

    [HttpPost("adjust")]
    public async Task<IActionResult> Adjust([FromBody] AdjustStockDto dto)
        => HandleResult(await _service.AdjustStockAsync(dto.ProductId, dto.WarehouseId, dto.NewQuantity, dto.Notes));

    [HttpGet("{productId}/movements")]
    public async Task<IActionResult> Movements(int productId, [FromQuery] DateTime from, [FromQuery] DateTime to,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        => HandleResult(await _service.GetMovementsAsync(productId, from, to, page, pageSize));
}
public record AdjustStockDto(int ProductId, int WarehouseId, decimal NewQuantity, string? Notes);

// ==================== FINANCE ====================

[Route("api/v1/finance")]
public class FinanceController : BaseApiController
{
    private readonly IFinanceService _service;
    public FinanceController(IFinanceService service) => _service = service;

    [HttpGet("accounts")]
    public async Task<IActionResult> Accounts()
        => HandleResult(await _service.GetAccountsAsync());

    [HttpPost("accounts")]
    public async Task<IActionResult> CreateAccount([FromBody] CreateAccountDto dto)
        => HandleResult(await _service.CreateAccountAsync(dto.Name, dto.AccountType));
    
    [HttpPost("transactions")]
    public async Task<IActionResult> RecordTransaction([FromBody] CreateTransactionRequest request)
        => HandleResult(await _service.RecordTransactionAsync(request));

    [HttpGet("transactions")]
    public async Task<IActionResult> Transactions([FromQuery] int? accountId, [FromQuery] DateTime? from,
        [FromQuery] DateTime? to, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        => HandleResult(await _service.GetTransactionsAsync(accountId, from, to, page, pageSize));

    [HttpGet("total-balance")]
    public async Task<IActionResult> TotalBalance()
        => HandleResult(await _service.GetTotalBalanceAsync());
}
public record CreateAccountDto(string Name, Domain.Enums.AccountType AccountType);

// ==================== EMPLOYEES ====================

[Route("api/v1/employees")]
public class EmployeesController : BaseApiController
{
    private readonly IEmployeeService _service;
    public EmployeesController(IEmployeeService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest request)
        => HandleResult(await _service.CreateAsync(request));

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => HandleResult(await _service.GetAllAsync());

    [HttpPost("{id}/attendance")]
    public async Task<IActionResult> Attendance(int id, [FromBody] AttendanceDto dto)
        => HandleResult(await _service.RecordAttendanceAsync(id, dto.Date, dto.CheckIn, dto.CheckOut, dto.Status));

    [HttpPost("payroll")]
    public async Task<IActionResult> Payroll([FromBody] PayrollDto dto)
        => HandleResult(await _service.ProcessPayrollAsync(dto.Month, dto.Year));
}
public record AttendanceDto(DateTime Date, TimeSpan? CheckIn, TimeSpan? CheckOut, byte Status);
public record PayrollDto(int Month, int Year);

// ==================== INSTALLMENTS ====================

[Route("api/v1/installments")]
public class InstallmentsController : BaseApiController
{
    private readonly IInstallmentService _service;
    public InstallmentsController(IInstallmentService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInstallmentRequest request)
        => HandleResult(await _service.CreateAsync(request));

    [HttpGet("active")]
    public async Task<IActionResult> Active()
        => HandleResult(await _service.GetActiveAsync());

    [HttpPost("{id}/pay/{paymentNumber}")]
    public async Task<IActionResult> Pay(int id, int paymentNumber, [FromBody] InstPayDto dto)
        => HandleResult(await _service.RecordPaymentAsync(id, paymentNumber, dto.Amount));

    [HttpGet("overdue")]
    public async Task<IActionResult> Overdue()
        => HandleResult(await _service.GetOverdueAsync());
}
public record InstPayDto(decimal Amount);

// ==================== DASHBOARD ====================

[Route("api/v1/dashboard")]
public class DashboardController : BaseApiController
{
    private readonly IDashboardService _service;
    public DashboardController(IDashboardService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] DateTime? date)
        => HandleResult(await _service.GetDashboardAsync(date ?? DateTime.UtcNow));
}

// ==================== REPORTS ====================

[Route("api/v1/reports")]
public class ReportsController : BaseApiController
{
    private readonly IReportService _service;
    public ReportsController(IReportService service) => _service = service;

    [HttpGet("sales")]
    public async Task<IActionResult> Sales([FromQuery] SalesReportRequest request)
        => HandleResult(await _service.GetSalesReportAsync(request));

    [HttpGet("profit")]
    public async Task<IActionResult> Profit([FromQuery] ProfitReportRequest request)
        => HandleResult(await _service.GetProfitReportAsync(request));

    [HttpGet("inventory")]
    public async Task<IActionResult> Inventory([FromQuery] InventoryReportRequest request)
        => HandleResult(await _service.GetInventoryReportAsync(request));

    [HttpGet("account-statement")]
    public async Task<IActionResult> AccountStatement([FromQuery] AccountStatementRequest request)
        => HandleResult(await _service.GetAccountStatementAsync(request));

    [HttpGet("financial-summary")]
    public async Task<IActionResult> Financial([FromQuery] DateTime from, [FromQuery] DateTime to)
        => HandleResult(await _service.GetFinancialSummaryAsync(from, to));
}
