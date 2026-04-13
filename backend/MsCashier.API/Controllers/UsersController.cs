using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Enums;

namespace MsCashier.API.Controllers;

/// <summary>إدارة المستخدمين والصلاحيات</summary>
[Route("api/v1/users")]
public class UsersController : BaseApiController
{
    private readonly IUserService _userService;
    public UsersController(IUserService userService) => _userService = userService;

    /// <summary>عرض جميع المستخدمين</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _userService.GetAllAsync();
        return HandleResult(result);
    }

    /// <summary>إنشاء مستخدم جديد</summary>
    /// <param name="request">بيانات المستخدم</param>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var result = await _userService.CreateAsync(request);
        return HandleResult(result);
    }

    /// <summary>تحديث بيانات مستخدم</summary>
    /// <param name="id">معرف المستخدم</param>
    /// <param name="request">البيانات المحدثة</param>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request)
    {
        var result = await _userService.UpdateAsync(id, request);
        return HandleResult(result);
    }

    /// <summary>حذف مستخدم</summary>
    /// <param name="id">معرف المستخدم</param>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _userService.DeleteAsync(id);
        return HandleResult(result);
    }

    /// <summary>تفعيل/تعطيل مستخدم</summary>
    /// <param name="id">معرف المستخدم</param>
    [HttpPost("{id:guid}/toggle-active")]
    public async Task<IActionResult> ToggleActive(Guid id)
    {
        var result = await _userService.ToggleActiveAsync(id);
        return HandleResult(result);
    }

    /// <summary>تحديث صلاحيات مستخدم</summary>
    /// <param name="id">معرف المستخدم</param>
    /// <param name="permissions">قائمة الصلاحيات</param>
    [HttpPut("{id:guid}/permissions")]
    public async Task<IActionResult> UpdatePermissions(Guid id, [FromBody] List<PermissionDto> permissions)
    {
        var result = await _userService.UpdatePermissionsAsync(id, permissions);
        return HandleResult(result);
    }
}

// ============================================================
// SubscriptionController (PUBLIC — no auth required for submit)
// ============================================================
