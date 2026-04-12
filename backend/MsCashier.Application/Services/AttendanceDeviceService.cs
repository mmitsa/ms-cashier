using MsCashier.Application.DTOs;
using MsCashier.Application.Interfaces;
using MsCashier.Domain.Common;
using MsCashier.Domain.Entities;
using MsCashier.Domain.Enums;
using MsCashier.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MsCashier.Application.Services;

// ════════════════════════════════════════════════════════════════
// HR: Attendance Device Service
// ════════════════════════════════════════════════════════════════

public class AttendanceDeviceService : IAttendanceDeviceService
{
    private readonly IUnitOfWork _uow;
    public AttendanceDeviceService(IUnitOfWork uow) => _uow = uow;

    public async Task<Result<List<AttendanceDeviceDto>>> GetAllAsync()
    {
        try
        {
            var devices = await _uow.Repository<AttendanceDevice>().Query()
                .Where(d => !d.IsDeleted).OrderBy(d => d.Name).ToListAsync();
            return Result<List<AttendanceDeviceDto>>.Success(devices.Select(MapDevice).ToList());
        }
        catch (Exception ex) { return Result<List<AttendanceDeviceDto>>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<AttendanceDeviceDto>> SaveAsync(int? id, SaveDeviceRequest req)
    {
        try
        {
            AttendanceDevice device;
            if (id.HasValue)
            {
                device = await _uow.Repository<AttendanceDevice>().Query()
                    .FirstOrDefaultAsync(d => d.Id == id.Value && !d.IsDeleted)
                    ?? throw new Exception("الجهاز غير موجود");
                device.Name = req.Name; device.Model = req.Model;
                device.IpAddress = req.IpAddress; device.Port = req.Port;
                device.SerialNumber = req.SerialNumber; device.Location = req.Location;
                _uow.Repository<AttendanceDevice>().Update(device);
            }
            else
            {
                device = new AttendanceDevice
                {
                    Name = req.Name, Model = req.Model, IpAddress = req.IpAddress,
                    Port = req.Port, SerialNumber = req.SerialNumber,
                    Location = req.Location, IsActive = true
                };
                await _uow.Repository<AttendanceDevice>().AddAsync(device);
            }
            await _uow.SaveChangesAsync();
            return Result<AttendanceDeviceDto>.Success(MapDevice(device),
                id.HasValue ? "تم تحديث الجهاز" : "تم إضافة الجهاز");
        }
        catch (Exception ex) { return Result<AttendanceDeviceDto>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> DeleteAsync(int id)
    {
        try
        {
            var device = await _uow.Repository<AttendanceDevice>().Query()
                .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);
            if (device is null) return Result<bool>.Failure("الجهاز غير موجود");
            device.IsDeleted = true;
            _uow.Repository<AttendanceDevice>().Update(device);
            await _uow.SaveChangesAsync();
            return Result<bool>.Success(true, "تم حذف الجهاز");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ: {ex.Message}"); }
    }

    public async Task<Result<bool>> TestConnectionAsync(int deviceId)
    {
        try
        {
            var device = await _uow.Repository<AttendanceDevice>().Query()
                .FirstOrDefaultAsync(d => d.Id == deviceId && !d.IsDeleted);
            if (device is null) return Result<bool>.Failure("الجهاز غير موجود");

            using var client = new System.Net.Sockets.TcpClient();
            var connectTask = client.ConnectAsync(device.IpAddress, device.Port);
            var completed = await Task.WhenAny(connectTask, Task.Delay(5000));
            bool success = completed == connectTask && client.Connected;
            return success
                ? Result<bool>.Success(true, "تم الاتصال بالجهاز بنجاح")
                : Result<bool>.Failure("لم يتم الاتصال بالجهاز — تحقق من IP والمنفذ");
        }
        catch (Exception ex) { return Result<bool>.Failure($"خطأ في الاتصال: {ex.Message}"); }
    }

    public async Task<Result<DeviceSyncResult>> SyncDeviceAsync(int deviceId)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            var device = await _uow.Repository<AttendanceDevice>().Query()
                .FirstOrDefaultAsync(d => d.Id == deviceId && !d.IsDeleted);
            if (device is null) return Result<DeviceSyncResult>.Failure("الجهاز غير موجود");

            device.LastSyncStatus = DeviceSyncStatus.Syncing;
            _uow.Repository<AttendanceDevice>().Update(device);
            await _uow.SaveChangesAsync();

            int synced = await SyncFromDevice(device);

            sw.Stop();
            device.LastSyncStatus = DeviceSyncStatus.Success;
            device.LastSyncAt = DateTime.UtcNow;
            device.LastSyncRecords = synced;
            device.LastSyncError = null;
            _uow.Repository<AttendanceDevice>().Update(device);
            await _uow.SaveChangesAsync();

            return Result<DeviceSyncResult>.Success(
                new DeviceSyncResult(true, synced, $"تم مزامنة {synced} سجل من الجهاز", (int)sw.ElapsedMilliseconds));
        }
        catch (Exception ex)
        {
            sw.Stop();
            try
            {
                var dev = await _uow.Repository<AttendanceDevice>().Query()
                    .FirstOrDefaultAsync(d => d.Id == deviceId);
                if (dev != null)
                {
                    dev.LastSyncStatus = DeviceSyncStatus.Failed;
                    dev.LastSyncError = ex.Message;
                    _uow.Repository<AttendanceDevice>().Update(dev);
                    await _uow.SaveChangesAsync();
                }
            }
            catch { /* ignore cleanup errors */ }
            return Result<DeviceSyncResult>.Failure($"خطأ في المزامنة: {ex.Message}");
        }
    }

    public async Task<Result<DeviceSyncResult>> SyncAllDevicesAsync()
    {
        try
        {
            var devices = await _uow.Repository<AttendanceDevice>().Query()
                .Where(d => !d.IsDeleted && d.IsActive).ToListAsync();
            int totalSynced = 0;
            var errors = new List<string>();
            foreach (var d in devices)
            {
                var result = await SyncDeviceAsync(d.Id);
                if (result.IsSuccess) totalSynced += result.Data!.RecordsSynced;
                else errors.Add($"{d.Name}: {result.Message}");
            }
            string msg = $"تم مزامنة {totalSynced} سجل من {devices.Count} أجهزة";
            if (errors.Any()) msg += $" | أخطاء: {string.Join(", ", errors)}";
            return Result<DeviceSyncResult>.Success(new DeviceSyncResult(true, totalSynced, msg, null));
        }
        catch (Exception ex) { return Result<DeviceSyncResult>.Failure($"خطأ: {ex.Message}"); }
    }

    private async Task<int> SyncFromDevice(AttendanceDevice device)
    {
        // ZKTeco protocol: connect TCP → authenticate → read attendance logs
        // Real implementation uses ZKTeco PUSH SDK (CZKEM / ZKLib)
        // Protocol: CMD_CONNECT (0x03E8) → CMD_ATTLOG_RRQ (0x000D) → parse records

        using var tcpClient = new System.Net.Sockets.TcpClient();
        var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        await tcpClient.ConnectAsync(device.IpAddress, device.Port, cts.Token);
        var stream = tcpClient.GetStream();
        stream.ReadTimeout = 10000;
        stream.WriteTimeout = 5000;

        // Send CONNECT command
        byte[] connectCmd = BuildZKPacket(0x03E8, new byte[] { 0x00, 0x00 });
        await stream.WriteAsync(connectCmd, cts.Token);
        var response = new byte[1024];
        int read = await stream.ReadAsync(response, cts.Token);
        if (read < 8) throw new Exception("استجابة غير صالحة من الجهاز");

        // Request attendance log
        byte[] attLogCmd = BuildZKPacket(0x000D, Array.Empty<byte>());
        await stream.WriteAsync(attLogCmd, cts.Token);

        var allData = new List<byte>();
        var buffer = new byte[4096];
        while (true)
        {
            int bytesRead = await stream.ReadAsync(buffer, cts.Token);
            if (bytesRead == 0) break;
            allData.AddRange(buffer.Take(bytesRead));
            if (bytesRead < buffer.Length) break;
        }

        // Parse records
        int synced = 0;
        var employees = await _uow.Repository<Employee>().Query()
            .Where(e => !e.IsDeleted && e.DeviceUserId != null).ToListAsync();
        var empMap = employees.ToDictionary(e => e.DeviceUserId!, e => e.Id);

        int offset = 8;
        const int recordSize = 40;
        while (offset + recordSize <= allData.Count)
        {
            try
            {
                var userIdBytes = allData.Skip(offset).Take(9).ToArray();
                var userId = System.Text.Encoding.ASCII.GetString(userIdBytes).TrimEnd('\0');
                var timestampBytes = allData.Skip(offset + 24).Take(4).ToArray();
                var encodedTime = BitConverter.ToUInt32(timestampBytes, 0);
                var punchTime = DecodeZKTime(encodedTime);
                var statusByte = allData[offset + 28];
                bool isCheckIn = statusByte % 2 == 0;

                if (empMap.TryGetValue(userId, out int empId))
                {
                    var exists = await _uow.Repository<AttendancePunch>().Query()
                        .AnyAsync(p => p.EmployeeId == empId &&
                                       p.PunchTime == punchTime &&
                                       p.Source == AttendancePunchSource.Device);
                    if (!exists)
                    {
                        await _uow.Repository<AttendancePunch>().AddAsync(new AttendancePunch
                        {
                            EmployeeId = empId, PunchTime = punchTime,
                            IsCheckIn = isCheckIn, Source = AttendancePunchSource.Device,
                            DeviceId = device.Id, DeviceUserId = userId
                        });
                        synced++;
                    }
                }
            }
            catch { /* skip malformed */ }
            offset += recordSize;
        }
        if (synced > 0) await _uow.SaveChangesAsync();

        // Disconnect
        byte[] disconnectCmd = BuildZKPacket(0x03E9, Array.Empty<byte>());
        await stream.WriteAsync(disconnectCmd, cts.Token);
        tcpClient.Close();
        return synced;
    }

    private static byte[] BuildZKPacket(ushort command, byte[] data)
    {
        var packet = new byte[16 + data.Length];
        packet[0] = 0x50; packet[1] = 0x50; packet[2] = 0x82; packet[3] = 0x7D;
        BitConverter.GetBytes((ushort)(8 + data.Length)).CopyTo(packet, 4);
        BitConverter.GetBytes(command).CopyTo(packet, 6);
        Array.Copy(data, 0, packet, 16, data.Length);
        return packet;
    }

    private static DateTime DecodeZKTime(uint encodedTime)
    {
        int second = (int)(encodedTime % 60); encodedTime /= 60;
        int minute = (int)(encodedTime % 60); encodedTime /= 60;
        int hour = (int)(encodedTime % 24); encodedTime /= 24;
        int day = (int)(encodedTime % 31) + 1; encodedTime /= 31;
        int month = (int)(encodedTime % 12) + 1; encodedTime /= 12;
        int year = (int)encodedTime + 2000;
        try { return new DateTime(year, month, day, hour, minute, second); }
        catch { return DateTime.UtcNow; }
    }

    private static AttendanceDeviceDto MapDevice(AttendanceDevice d) => new(
        d.Id, d.Name, d.Model, d.IpAddress, d.Port, d.SerialNumber, d.Location,
        d.IsActive, d.LastSyncStatus, d.LastSyncAt, d.LastSyncRecords, d.LastSyncError);
}

// ════════════════════════════════════════════════════════════════
// HR: Attendance Management Service
// ════════════════════════════════════════════════════════════════

