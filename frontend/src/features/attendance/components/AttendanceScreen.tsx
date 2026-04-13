import { useState, useMemo } from 'react';
import {
  Fingerprint, RefreshCw, Wifi, WifiOff, Plus, Trash2, Clock,
  CalendarDays, Users, Timer, AlertCircle, Loader2, X, ChevronLeft,
  ChevronRight, Monitor, CheckCircle2, XCircle, Settings2, Download, UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  useAttendanceDevices, useSaveDevice, useDeleteDevice, useTestDevice,
  useSyncDevice, useSyncAllDevices, useAttendanceDailySummary,
  useAttendanceMonthSummary, useManualPunch, useDeletePunch, useEmployees,
} from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils/cn';
import type { AttendanceDeviceDto, AttendanceDailySummaryDto, AttendanceMonthSummaryDto } from '@/types/api.types';
import toast from 'react-hot-toast';

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const STATUS_FALLBACK = { label: 'غير معروف', color: 'bg-gray-100 text-gray-700' };
const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'حاضر', color: 'bg-emerald-100 text-emerald-700' },
  2: { label: 'غائب', color: 'bg-red-100 text-red-700' },
  3: { label: 'متأخر', color: 'bg-amber-100 text-amber-700' },
  4: { label: 'إجازة', color: 'bg-blue-100 text-blue-700' },
};
const SOURCE_LABELS: Record<number, string> = { 1: 'يدوي', 2: 'جهاز', 3: 'موبايل', 4: 'نظام' };
const SYNC_FALLBACK = { label: 'غير معروف', color: 'text-gray-400' };
const SYNC_STATUS: Record<number, { label: string; color: string }> = {
  1: { label: 'في الانتظار', color: 'text-gray-500' },
  2: { label: 'جاري المزامنة', color: 'text-blue-500' },
  3: { label: 'نجحت', color: 'text-emerald-500' },
  4: { label: 'فشلت', color: 'text-red-500' },
};

type Tab = 'daily' | 'monthly' | 'devices';

export function AttendanceScreen() {
  const [tab, setTab] = useState<Tab>('daily');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState<AttendanceDeviceDto | null | 'new'>(null);

  const today = `${year}-${String(month).padStart(2, '0')}-01`;
  const endOfMonth = new Date(year, month, 0);
  const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;

  const { data: dailyData, isLoading: dailyLoading } = useAttendanceDailySummary({ dateFrom: today, dateTo, page: 1, pageSize: 200 });
  const { data: monthlyData, isLoading: monthlyLoading } = useAttendanceMonthSummary(month, year);
  const { data: devices, isLoading: devicesLoading } = useAttendanceDevices();
  const syncAll = useSyncAllDevices();

  const dailySummaries = (dailyData as any)?.items ?? dailyData ?? [];
  const monthlySummaries = (monthlyData ?? []) as AttendanceMonthSummaryDto[];

  const goMonth = (dir: number) => {
    let m = month + dir, y = year;
    if (m > 12) { m = 1; y++; } else if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  // Stats for the month
  const stats = useMemo(() => {
    const totalEmp = monthlySummaries.length;
    const avgPresent = totalEmp > 0 ? monthlySummaries.reduce((s, e) => s + e.presentDays, 0) / totalEmp : 0;
    const totalAbsent = monthlySummaries.reduce((s, e) => s + e.absentDays, 0);
    const totalLate = monthlySummaries.reduce((s, e) => s + e.lateDays, 0);
    return { totalEmp, avgPresent, totalAbsent, totalLate };
  }, [monthlySummaries]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Fingerprint size={28} className="text-brand-600" />
            الحضور والانصراف
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إدارة الحضور وأجهزة البصمة والمزامنة</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => syncAll.mutate()} disabled={syncAll.isPending}
            className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={16} className={syncAll.isPending ? 'animate-spin' : ''} />
            مزامنة جميع الأجهزة
          </button>
          <button onClick={() => setShowPunchModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />
            تسجيل حضور يدوي
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الموظفين', value: stats.totalEmp, icon: Users, color: 'bg-brand-600' },
          { label: 'متوسط أيام الحضور', value: stats.avgPresent.toFixed(1), icon: CheckCircle2, color: 'bg-emerald-600' },
          { label: 'إجمالي الغياب', value: stats.totalAbsent, icon: XCircle, color: 'bg-red-500' },
          { label: 'إجمالي التأخير', value: stats.totalLate, icon: Timer, color: 'bg-amber-500' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between card p-3">
        <button onClick={() => goMonth(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRight size={20} /></button>
        <span className="font-bold text-gray-900 dark:text-gray-100">{MONTHS[month - 1]} {year}</span>
        <button onClick={() => goMonth(1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeft size={20} /></button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {[
          { id: 'daily' as Tab, label: 'السجل اليومي', icon: CalendarDays },
          { id: 'monthly' as Tab, label: 'ملخص الشهر', icon: Clock },
          { id: 'devices' as Tab, label: 'أجهزة البصمة', icon: Monitor },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white dark:bg-gray-900 text-brand-700 dark:text-brand-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'daily' && (
        <DailyTab data={dailySummaries} isLoading={dailyLoading} />
      )}
      {tab === 'monthly' && (
        <MonthlyTab data={monthlySummaries} isLoading={monthlyLoading} month={month} year={year} />
      )}
      {tab === 'devices' && (
        <DevicesTab devices={devices ?? []} isLoading={devicesLoading} onAdd={() => setShowDeviceModal('new')} onEdit={(d) => setShowDeviceModal(d)} />
      )}

      {/* Modals */}
      {showPunchModal && <ManualPunchModal onClose={() => setShowPunchModal(false)} />}
      {showDeviceModal && (
        <DeviceModal device={showDeviceModal === 'new' ? null : showDeviceModal} onClose={() => setShowDeviceModal(null)} />
      )}
    </div>
  );
}

// ==================== Daily Tab ====================
function DailyTab({ data, isLoading }: { data: AttendanceDailySummaryDto[]; isLoading: boolean }) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data.length) return <EmptyState message="لا توجد سجلات حضور لهذه الفترة" />;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الموظف</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">التاريخ</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الحضور</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الانصراف</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الساعات</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الحالة</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">المصدر</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const st = STATUS_LABELS[row.status] ?? STATUS_FALLBACK;
              return (
                <tr key={i} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xs shrink-0">
                        {row.employeeName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{row.employeeName}</p>
                        {row.department && <p className="text-xs text-gray-400">{row.department}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{row.date}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 font-mono">{row.firstCheckIn ?? '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 font-mono">{row.lastCheckOut ?? '—'}</td>
                  <td className="py-3 px-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                    {row.totalHours != null ? `${row.totalHours.toFixed(1)} س` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${st.color}`}>{st.label}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                    {row.punches && row.punches.length > 0 && row.punches[0] ? SOURCE_LABELS[row.punches[0].source] ?? 'نظام' : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== Monthly Tab ====================
function MonthlyTab({ data, isLoading, month, year }: { data: AttendanceMonthSummaryDto[]; isLoading: boolean; month: number; year: number }) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data.length) return <EmptyState message="لا يوجد موظفون بهذا الشهر" />;

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">ملخص حضور الشهر — {MONTHS[month - 1]} {year}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">الموظف</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">القسم</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">أيام العمل</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">حضور</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">غياب</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">تأخير</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">إجمالي الساعات</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">نسبة الحضور</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const pct = row.workingDays > 0 ? ((row.presentDays / row.workingDays) * 100) : 0;
              return (
                <tr key={row.employeeId} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100 text-sm">{row.employeeName}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{row.department ?? '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{row.workingDays}</td>
                  <td className="py-3 px-4 text-sm font-bold text-emerald-600">{row.presentDays}</td>
                  <td className="py-3 px-4 text-sm font-bold text-red-600">{row.absentDays}</td>
                  <td className="py-3 px-4 text-sm font-bold text-amber-600">{row.lateDays}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{row.totalHours.toFixed(1)} س</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{pct.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== Devices Tab ====================
function DevicesTab({ devices, isLoading, onAdd, onEdit }: {
  devices: AttendanceDeviceDto[]; isLoading: boolean;
  onAdd: () => void; onEdit: (d: AttendanceDeviceDto) => void;
}) {
  const syncDevice = useSyncDevice();
  const testDevice = useTestDevice();
  const deleteDevice = useDeleteDevice();

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">أجهزة البصمة المتصلة</h3>
        <button onClick={onAdd} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={16} />
          إضافة جهاز
        </button>
      </div>

      {devices.length === 0 ? (
        <EmptyState message="لم يتم إضافة أجهزة بصمة بعد" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => {
            const syncSt = SYNC_STATUS[device.lastSyncStatus] ?? SYNC_FALLBACK;
            return (
              <div key={device.id} className="card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      device.isActive ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}>
                      <Fingerprint size={22} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-gray-100">{device.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{device.model ?? 'جهاز بصمة'}</p>
                    </div>
                  </div>
                  <Badge variant={device.isActive ? 'success' : 'danger'}>
                    {device.isActive ? 'نشط' : 'متوقف'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>IP</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">{device.ipAddress}:{device.port}</span>
                  </div>
                  {device.location && (
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>الموقع</span>
                      <span className="text-gray-900 dark:text-gray-100">{device.location}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>حالة المزامنة</span>
                    <span className={`font-bold ${syncSt.color}`}>{syncSt.label}</span>
                  </div>
                  {device.lastSyncAt && (
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>آخر مزامنة</span>
                      <span className="text-gray-900 dark:text-gray-100 text-xs">{new Date(device.lastSyncAt).toLocaleString('ar')}</span>
                    </div>
                  )}
                  {device.lastSyncRecords != null && (
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>سجلات آخر مزامنة</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{device.lastSyncRecords}</span>
                    </div>
                  )}
                </div>

                {device.lastSyncError && (
                  <div className="bg-red-50 dark:bg-red-950 rounded-lg p-2 text-xs text-red-600">{device.lastSyncError}</div>
                )}

                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => testDevice.mutate(device.id)}
                    disabled={testDevice.isPending}
                    className="flex-1 btn-secondary text-xs flex items-center justify-center gap-1">
                    <Wifi size={14} />
                    اختبار
                  </button>
                  <button onClick={() => syncDevice.mutate(device.id)}
                    disabled={syncDevice.isPending}
                    className="flex-1 btn-primary text-xs flex items-center justify-center gap-1">
                    <RefreshCw size={14} className={syncDevice.isPending ? 'animate-spin' : ''} />
                    مزامنة
                  </button>
                  <button onClick={() => onEdit(device)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                    <Settings2 size={14} />
                  </button>
                  <button onClick={() => { if (confirm('حذف الجهاز؟')) deleteDevice.mutate(device.id); }}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== Manual Punch Modal ====================
function ManualPunchModal({ onClose }: { onClose: () => void }) {
  const { data: employees } = useEmployees();
  const punch = useManualPunch();
  const [empId, setEmpId] = useState(0);
  const [isCheckIn, setIsCheckIn] = useState(true);
  const [punchTime, setPunchTime] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId) return;
    punch.mutate({ employeeId: empId, punchTime: new Date(punchTime).toISOString(), isCheckIn, notes: notes || undefined }, { onSuccess: () => onClose() });
  };

  return (
    <Modal onClose={onClose} title="تسجيل حضور يدوي">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">الموظف *</label>
          <select value={empId} onChange={(e) => setEmpId(Number(e.target.value))} className="input" required>
            <option value={0}>اختر الموظف...</option>
            {(employees ?? []).map((emp: any) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">النوع</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsCheckIn(true)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition ${
                  isCheckIn ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'
                }`}>حضور</button>
              <button type="button" onClick={() => setIsCheckIn(false)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition ${
                  !isCheckIn ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'
                }`}>انصراف</button>
            </div>
          </div>
          <div>
            <label className="label">الوقت</label>
            <input type="datetime-local" value={punchTime} onChange={(e) => setPunchTime(e.target.value)} className="input" required />
          </div>
        </div>
        <div>
          <label className="label">ملاحظات</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="input" placeholder="اختياري" />
        </div>
        <div className="flex gap-3 pt-4 border-t">
          <button type="submit" disabled={punch.isPending || !empId} className="btn-primary flex-1">
            {punch.isPending ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
            تسجيل
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
        </div>
      </form>
    </Modal>
  );
}

// ==================== Device Modal ====================
function DeviceModal({ device, onClose }: { device: AttendanceDeviceDto | null; onClose: () => void }) {
  const saveDevice = useSaveDevice();
  const [form, setForm] = useState({
    name: device?.name ?? '',
    model: device?.model ?? '',
    ipAddress: device?.ipAddress ?? '',
    port: device?.port ?? 4370,
    serialNumber: device?.serialNumber ?? '',
    location: device?.location ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveDevice.mutate({ id: device?.id ?? null, data: form }, { onSuccess: () => onClose() });
  };

  return (
    <Modal onClose={onClose} title={device ? 'تعديل الجهاز' : 'إضافة جهاز بصمة'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">اسم الجهاز *</label>
            <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="input" placeholder="مثال: جهاز الاستقبال" required />
          </div>
          <div>
            <label className="label">الموديل</label>
            <input type="text" value={form.model} onChange={(e) => setForm(f => ({ ...f, model: e.target.value }))}
              className="input" placeholder="مثال: ZKTeco K40" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">عنوان IP *</label>
            <input type="text" value={form.ipAddress} onChange={(e) => setForm(f => ({ ...f, ipAddress: e.target.value }))}
              className="input font-mono" placeholder="192.168.1.100" required />
          </div>
          <div>
            <label className="label">المنفذ</label>
            <input type="number" value={form.port} onChange={(e) => setForm(f => ({ ...f, port: Number(e.target.value) }))}
              className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">الرقم التسلسلي</label>
            <input type="text" value={form.serialNumber} onChange={(e) => setForm(f => ({ ...f, serialNumber: e.target.value }))}
              className="input" />
          </div>
          <div>
            <label className="label">الموقع</label>
            <input type="text" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
              className="input" placeholder="مثال: المدخل الرئيسي" />
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t">
          <button type="submit" disabled={saveDevice.isPending} className="btn-primary flex-1">
            {saveDevice.isPending ? <Loader2 size={18} className="animate-spin" /> : <Fingerprint size={18} />}
            حفظ
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
        </div>
      </form>
    </Modal>
  );
}

// ==================== Shared Components ====================
function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="card py-12 text-center">
      <Fingerprint size={48} className="mx-auto text-gray-300 mb-4" />
      <p className="text-gray-500 dark:text-gray-400 font-medium">{message}</p>
    </div>
  );
}
