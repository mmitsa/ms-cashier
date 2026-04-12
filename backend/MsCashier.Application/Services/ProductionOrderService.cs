using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// ProductionOrderService
// ════════════════════════════════════════════════════════════════

public class ProductionOrderService : IProductionOrderService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentTenantService _tenant;

    public ProductionOrderService(IUnitOfWork uow, ICurrentTenantService tenant)
    {
        _uow = uow;
        _tenant = tenant;
    }

    public async Task<Result<ProductionOrderDto>> CreateAsync(CreateProductionOrderRequest request)
    {
        try
        {
            var recipe = await _uow.Repository<Recipe>().Query()
                .Include(r => r.Ingredients).ThenInclude(i => i.RawMaterial)
                .Include(r => r.Ingredients).ThenInclude(i => i.Unit)
                .FirstOrDefaultAsync(r => r.Id == request.RecipeId);

            if (recipe == null) return Result<ProductionOrderDto>.Failure("الوصفة غير موجودة");

            var code = $"PRD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
            var scaleFactor = recipe.YieldQuantity > 0 ? request.PlannedQuantity / recipe.YieldQuantity : 1;

            var order = new ProductionOrder
            {
                Code = code,
                RecipeId = request.RecipeId,
                PlannedQuantity = request.PlannedQuantity,
                PlannedUnitId = request.PlannedUnitId ?? recipe.YieldUnitId,
                Status = ProductionOrderStatus.Draft,
                Priority = !string.IsNullOrEmpty(request.Priority) ? Enum.Parse<ProductionPriority>(request.Priority) : ProductionPriority.Normal,
                PlannedStartDate = request.PlannedStartDate,
                PlannedEndDate = request.PlannedEndDate,
                AssignedToUserId = request.AssignedToUserId,
                Notes = request.Notes,
                TargetWarehouseId = request.TargetWarehouseId,
                SourceWarehouseId = request.SourceWarehouseId,
                BatchNumber = request.BatchNumber,
                ExpiryDate = request.ExpiryDate,
                BranchId = request.BranchId,
                CreatedByUserId = _tenant.UserId
            };

            await _uow.Repository<ProductionOrder>().AddAsync(order);
            await _uow.SaveChangesAsync();

            // Create items from recipe ingredients
            decimal totalCost = 0;
            foreach (var ing in recipe.Ingredients.Where(i => i.IngredientType == IngredientType.RawMaterial && i.RawMaterialId.HasValue))
            {
                var grossQty = ing.WastePercent > 0 ? ing.Quantity / (1 - ing.WastePercent / 100) : ing.Quantity;
                var requiredQty = grossQty * scaleFactor;
                var unitCost = ing.RawMaterial?.CostPrice ?? 0;

                var item = new ProductionOrderItem
                {
                    ProductionOrderId = order.Id,
                    RecipeIngredientId = ing.Id,
                    ProductId = ing.RawMaterialId!.Value,
                    RequiredQuantity = requiredQty,
                    UnitId = ing.UnitId,
                    UnitCost = unitCost,
                    TotalCost = requiredQty * unitCost
                };
                totalCost += item.TotalCost;
                await _uow.Repository<ProductionOrderItem>().AddAsync(item);
            }

            order.EstimatedCost = totalCost;
            _uow.Repository<ProductionOrder>().Update(order);
            await _uow.SaveChangesAsync();

            return await GetByIdAsync(order.Id);
        }
        catch (Exception ex) { return Result<ProductionOrderDto>.Failure($"خطأ في إنشاء أمر الإنتاج: {ex.Message}"); }
    }

    public async Task<Result<ProductionOrderDto>> GetByIdAsync(int id)
    {
        try
        {
            var o = await _uow.Repository<ProductionOrder>().Query()
                .Include(o => o.Recipe)
                .Include(o => o.PlannedUnit)
                .Include(o => o.TargetWarehouse)
                .Include(o => o.SourceWarehouse)
                .Include(o => o.Items).ThenInclude(i => i.Product)
                .Include(o => o.Items).ThenInclude(i => i.Unit)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (o == null) return Result<ProductionOrderDto>.Failure("أمر الإنتاج غير موجود");

            // Get user names
            var assignedName = o.AssignedToUserId.HasValue
                ? (await _uow.Repository<User>().GetByIdAsync(o.AssignedToUserId.Value))?.FullName : null;
            var approvedName = o.ApprovedByUserId.HasValue
                ? (await _uow.Repository<User>().GetByIdAsync(o.ApprovedByUserId.Value))?.FullName : null;

            var dto = new ProductionOrderDto(
                o.Id, o.Code, o.RecipeId, o.Recipe?.Name ?? "",
                o.PlannedQuantity, o.PlannedUnitId, o.PlannedUnit?.Name,
                o.ActualQuantity, o.Status.ToString(), o.Priority.ToString(),
                o.PlannedStartDate, o.PlannedEndDate,
                o.ActualStartDate, o.ActualEndDate,
                o.AssignedToUserId, assignedName,
                o.ApprovedByUserId, approvedName, o.ApprovedAt,
                o.Notes, o.TargetWarehouseId, o.TargetWarehouse?.Name,
                o.SourceWarehouseId, o.SourceWarehouse?.Name,
                o.BatchNumber, o.ExpiryDate,
                o.EstimatedCost, o.ActualCost,
                o.BranchId, o.CreatedAt,
                o.Items.Select(i => new ProductionOrderItemDto(
                    i.Id, i.ProductId, i.Product?.Name ?? "",
                    i.RequiredQuantity, i.UnitId, i.Unit?.Name,
                    i.ActualQuantityUsed, i.UnitCost, i.TotalCost, i.Notes)).ToList());

            return Result<ProductionOrderDto>.Success(dto);
        }
        catch (Exception ex) { return Result<ProductionOrderDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<PagedResult<ProductionOrderDto>>> SearchAsync(ProductionOrderFilterRequest request)
    {
        try
        {
            var query = _uow.Repository<ProductionOrder>().Query()
                .Include(o => o.Recipe).Include(o => o.PlannedUnit)
                .Include(o => o.Items)
                .AsQueryable();

            if (!string.IsNullOrEmpty(request.Status))
                query = query.Where(o => o.Status == Enum.Parse<ProductionOrderStatus>(request.Status));
            if (!string.IsNullOrEmpty(request.Priority))
                query = query.Where(o => o.Priority == Enum.Parse<ProductionPriority>(request.Priority));
            if (request.RecipeId.HasValue)
                query = query.Where(o => o.RecipeId == request.RecipeId);
            if (request.DateFrom.HasValue)
                query = query.Where(o => o.CreatedAt >= request.DateFrom);
            if (request.DateTo.HasValue)
                query = query.Where(o => o.CreatedAt <= request.DateTo);

            var total = await query.CountAsync();
            var items = await query.OrderByDescending(o => o.CreatedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var dtos = items.Select(o => new ProductionOrderDto(
                o.Id, o.Code, o.RecipeId, o.Recipe?.Name ?? "",
                o.PlannedQuantity, o.PlannedUnitId, o.PlannedUnit?.Name,
                o.ActualQuantity, o.Status.ToString(), o.Priority.ToString(),
                o.PlannedStartDate, o.PlannedEndDate,
                o.ActualStartDate, o.ActualEndDate,
                null, null, null, null, o.ApprovedAt,
                o.Notes, o.TargetWarehouseId, null,
                o.SourceWarehouseId, null,
                o.BatchNumber, o.ExpiryDate,
                o.EstimatedCost, o.ActualCost,
                o.BranchId, o.CreatedAt,
                o.Items.Select(i => new ProductionOrderItemDto(
                    i.Id, i.ProductId, i.Product?.Name ?? "",
                    i.RequiredQuantity, i.UnitId, i.Unit?.Name,
                    i.ActualQuantityUsed, i.UnitCost, i.TotalCost, i.Notes)).ToList())).ToList();

            return Result<PagedResult<ProductionOrderDto>>.Success(
                new PagedResult<ProductionOrderDto> { Items = dtos, TotalCount = total, PageNumber = request.Page, PageSize = request.PageSize });
        }
        catch (Exception ex) { return Result<PagedResult<ProductionOrderDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<ProductionOrderDto>> UpdateAsync(int id, UpdateProductionOrderRequest request)
    {
        try
        {
            var order = await _uow.Repository<ProductionOrder>().GetByIdAsync(id);
            if (order == null) return Result<ProductionOrderDto>.Failure("أمر الإنتاج غير موجود");
            if (order.Status != ProductionOrderStatus.Draft)
                return Result<ProductionOrderDto>.Failure("لا يمكن تعديل أمر إنتاج غير مسودة");

            if (request.PlannedQuantity.HasValue) order.PlannedQuantity = request.PlannedQuantity.Value;
            if (!string.IsNullOrEmpty(request.Priority)) order.Priority = Enum.Parse<ProductionPriority>(request.Priority);
            if (request.PlannedStartDate.HasValue) order.PlannedStartDate = request.PlannedStartDate;
            if (request.PlannedEndDate.HasValue) order.PlannedEndDate = request.PlannedEndDate;
            if (request.AssignedToUserId.HasValue) order.AssignedToUserId = request.AssignedToUserId;
            if (request.Notes != null) order.Notes = request.Notes;
            if (request.TargetWarehouseId.HasValue) order.TargetWarehouseId = request.TargetWarehouseId;
            if (request.SourceWarehouseId.HasValue) order.SourceWarehouseId = request.SourceWarehouseId;
            if (request.BatchNumber != null) order.BatchNumber = request.BatchNumber;
            if (request.ExpiryDate.HasValue) order.ExpiryDate = request.ExpiryDate;

            _uow.Repository<ProductionOrder>().Update(order);
            await _uow.SaveChangesAsync();
            return await GetByIdAsync(id);
        }
        catch (Exception ex) { return Result<ProductionOrderDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        try
        {
            var order = await _uow.Repository<ProductionOrder>().GetByIdAsync(id);
            if (order == null) return Result<bool>.Failure("أمر الإنتاج غير موجود");
            if (order.Status != ProductionOrderStatus.Draft)
                return Result<bool>.Failure("لا يمكن حذف أمر إنتاج غير مسودة");
            order.IsDeleted = true;
            _uow.Repository<ProductionOrder>().Update(order);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, "تم حذف أمر الإنتاج");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<ProductionOrderDto>> ApproveAsync(int id)
    {
        try
        {
            var order = await _uow.Repository<ProductionOrder>().GetByIdAsync(id);
            if (order == null) return Result<ProductionOrderDto>.Failure("أمر الإنتاج غير موجود");
            if (order.Status != ProductionOrderStatus.Draft)
                return Result<ProductionOrderDto>.Failure("الأمر ليس في حالة مسودة");
            order.Status = ProductionOrderStatus.Approved;
            order.ApprovedByUserId = _tenant.UserId;
            order.ApprovedAt = DateTime.UtcNow;
            _uow.Repository<ProductionOrder>().Update(order);
            await _uow.SaveChangesAsync();
            return await GetByIdAsync(id);
        }
        catch (Exception ex) { return Result<ProductionOrderDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<ProductionOrderDto>> StartAsync(int id)
    {
        try
        {
            var order = await _uow.Repository<ProductionOrder>().Query()
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return Result<ProductionOrderDto>.Failure("أمر الإنتاج غير موجود");
            if (order.Status != ProductionOrderStatus.Approved)
                return Result<ProductionOrderDto>.Failure("يجب اعتماد الأمر أولاً");

            // Deduct raw materials from source warehouse
            if (order.SourceWarehouseId.HasValue)
            {
                foreach (var item in order.Items)
                {
                    var inventory = await _uow.Repository<Inventory>().Query()
                        .FirstOrDefaultAsync(i => i.TenantId == _tenant.TenantId &&
                            i.ProductId == item.ProductId && i.WarehouseId == order.SourceWarehouseId.Value);

                    if (inventory != null)
                    {
                        var prevQty = inventory.Quantity;
                        inventory.Quantity -= item.RequiredQuantity;
                        inventory.LastUpdated = DateTime.UtcNow;
                        _uow.Repository<Inventory>().Update(inventory);

                        await _uow.Repository<InventoryTransaction>().AddAsync(new InventoryTransaction
                        {
                            TenantId = _tenant.TenantId,
                            ProductId = item.ProductId,
                            WarehouseId = order.SourceWarehouseId.Value,
                            TransactionType = InventoryTransactionType.StockOut,
                            Quantity = item.RequiredQuantity,
                            PreviousQty = prevQty,
                            NewQty = inventory.Quantity,
                            ReferenceType = "ProductionOrder",
                            ReferenceId = order.Code,
                            Notes = $"صرف لأمر إنتاج {order.Code}",
                            CreatedBy = _tenant.UserId
                        });
                    }
                }
            }

            order.Status = ProductionOrderStatus.InProgress;
            order.ActualStartDate = DateTime.UtcNow;
            _uow.Repository<ProductionOrder>().Update(order);
            await _uow.SaveChangesAsync();
            return await GetByIdAsync(id);
        }
        catch (Exception ex) { return Result<ProductionOrderDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<ProductionOrderDto>> CompleteAsync(int id, CompleteProductionRequest request)
    {
        try
        {
            var order = await _uow.Repository<ProductionOrder>().Query()
                .Include(o => o.Recipe)
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return Result<ProductionOrderDto>.Failure("أمر الإنتاج غير موجود");
            if (order.Status != ProductionOrderStatus.InProgress)
                return Result<ProductionOrderDto>.Failure("الأمر ليس قيد التنفيذ");

            order.ActualQuantity = request.ActualQuantity;
            order.ActualEndDate = DateTime.UtcNow;
            order.Status = ProductionOrderStatus.Completed;

            // Update actual quantities if provided
            if (request.ItemActuals?.Any() == true)
            {
                decimal actualCost = 0;
                foreach (var actual in request.ItemActuals)
                {
                    var item = order.Items.FirstOrDefault(i => i.Id == actual.ItemId);
                    if (item != null)
                    {
                        item.ActualQuantityUsed = actual.ActualQuantityUsed;
                        item.TotalCost = actual.ActualQuantityUsed * item.UnitCost;
                        actualCost += item.TotalCost;
                        _uow.Repository<ProductionOrderItem>().Update(item);
                    }
                }
                order.ActualCost = actualCost;
            }

            // Add produced quantity to target warehouse
            if (order.TargetWarehouseId.HasValue && order.Recipe?.ProductId != null)
            {
                var productId = order.Recipe.ProductId.Value;
                var inventory = await _uow.Repository<Inventory>().Query()
                    .FirstOrDefaultAsync(i => i.TenantId == _tenant.TenantId &&
                        i.ProductId == productId && i.WarehouseId == order.TargetWarehouseId.Value);

                var prevQty = inventory?.Quantity ?? 0;
                if (inventory != null)
                {
                    inventory.Quantity += request.ActualQuantity;
                    inventory.LastUpdated = DateTime.UtcNow;
                    _uow.Repository<Inventory>().Update(inventory);
                }
                else
                {
                    inventory = new Inventory
                    {
                        TenantId = _tenant.TenantId,
                        ProductId = productId,
                        WarehouseId = order.TargetWarehouseId.Value,
                        Quantity = request.ActualQuantity
                    };
                    await _uow.Repository<Inventory>().AddAsync(inventory);
                }

                await _uow.Repository<InventoryTransaction>().AddAsync(new InventoryTransaction
                {
                    TenantId = _tenant.TenantId,
                    ProductId = productId,
                    WarehouseId = order.TargetWarehouseId.Value,
                    TransactionType = InventoryTransactionType.StockIn,
                    Quantity = request.ActualQuantity,
                    PreviousQty = prevQty,
                    NewQty = prevQty + request.ActualQuantity,
                    ReferenceType = "ProductionOrder",
                    ReferenceId = order.Code,
                    Notes = $"إنتاج من أمر {order.Code}",
                    CreatedBy = _tenant.UserId
                });
            }

            // Record waste if actual < planned
            if (request.ActualQuantity < order.PlannedQuantity)
            {
                var wasteQty = order.PlannedQuantity - request.ActualQuantity;
                var wasteProduct = order.Recipe?.ProductId;
                if (wasteProduct.HasValue)
                {
                    await _uow.Repository<ProductionWaste>().AddAsync(new ProductionWaste
                    {
                        TenantId = _tenant.TenantId,
                        ProductionOrderId = order.Id,
                        WasteType = WasteType.ProductionLoss,
                        ProductId = wasteProduct.Value,
                        Quantity = wasteQty,
                        UnitId = order.PlannedUnitId,
                        EstimatedCost = order.EstimatedCost > 0 && order.PlannedQuantity > 0
                            ? (wasteQty / order.PlannedQuantity) * order.EstimatedCost : 0,
                        Reason = "فرق الإنتاج (تلقائي)",
                        ReportedByUserId = _tenant.UserId,
                        BranchId = order.BranchId
                    });
                }
            }

            _uow.Repository<ProductionOrder>().Update(order);
            await _uow.SaveChangesAsync();
            return await GetByIdAsync(id);
        }
        catch (Exception ex) { return Result<ProductionOrderDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<ProductionOrderDto>> CancelAsync(int id, string? reason)
    {
        try
        {
            var order = await _uow.Repository<ProductionOrder>().GetByIdAsync(id);
            if (order == null) return Result<ProductionOrderDto>.Failure("أمر الإنتاج غير موجود");
            if (order.Status == ProductionOrderStatus.Completed)
                return Result<ProductionOrderDto>.Failure("لا يمكن إلغاء أمر مكتمل");
            order.Status = ProductionOrderStatus.Cancelled;
            order.Notes = string.IsNullOrEmpty(order.Notes) ? reason : $"{order.Notes}\nسبب الإلغاء: {reason}";
            _uow.Repository<ProductionOrder>().Update(order);
            await _uow.SaveChangesAsync();
            return await GetByIdAsync(id);
        }
        catch (Exception ex) { return Result<ProductionOrderDto>.Failure($"خطأ: {ex.Message}"); }
    }
}

// ════════════════════════════════════════════════════════════════
// ProductionWasteService
// ════════════════════════════════════════════════════════════════

