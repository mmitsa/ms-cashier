using MsCashier.Domain.Enums;

namespace MsCashier.Application.DTOs;

// Invoice
public record CreateInvoiceRequest(int? ContactId, int WarehouseId, PriceType PriceType, PaymentMethod PaymentMethod, decimal DiscountAmount, decimal PaidAmount, string? Notes, List<InvoiceItemRequest> Items);
public record InvoiceItemRequest(int ProductId, decimal Quantity, decimal UnitPrice, decimal DiscountAmount = 0);
public record InvoiceDto(long Id, string InvoiceNumber, InvoiceType InvoiceType, DateTime InvoiceDate, int? ContactId, string? ContactName, int WarehouseId, string WarehouseName, PriceType PriceType, decimal SubTotal, decimal DiscountAmount, decimal TaxAmount, decimal TotalAmount, decimal PaidAmount, decimal DueAmount, PaymentMethod PaymentMethod, PaymentStatus PaymentStatus, string? Notes, string CreatedByName, List<InvoiceItemDto> Items, bool ZatcaReported, string? ZatcaQrCode);
public record InvoiceItemDto(long Id, int ProductId, string ProductName, string? Barcode, decimal Quantity, string UnitName, decimal UnitPrice, decimal CostPrice, decimal DiscountAmount, decimal TaxAmount, decimal TotalPrice);
public record InvoiceSearchRequest(DateTime? DateFrom, DateTime? DateTo, int? ContactId, PaymentMethod? PaymentMethod, PaymentStatus? PaymentStatus, InvoiceType? InvoiceType, int Page = 1, int PageSize = 50);

