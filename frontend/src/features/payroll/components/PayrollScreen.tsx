import { useState, useMemo } from 'react';
import {
  DollarSign, FileText, Plus, Loader2, X, Check, Download, Printer,
  ChevronLeft, ChevronRight, AlertCircle, CalendarDays, Users,
  CheckCircle2, Clock, Banknote, CreditCard, TrendingUp, Eye, Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  useGeneratePayroll, useApprovePayroll, usePayPayroll,
  usePayrolls, usePayrollHistory, usePayslip, useDeletePayroll,
  useEmployees,
} from '@/hooks/useApi';
import { formatCurrency, formatDate } from '@/lib/utils/cn';
import type { PayrollDetailDto, PayrollMonthSummaryDto, PayslipDto } from '@/types/api.types';
import toast from 'react-hot-toast';

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const STATUS_FALLBACK = { label: 'غير معروف', color: 'warning' as const };
const STATUS_MAP: Record<number, { label: string; color: 'warning' | 'info' | 'success' | 'danger' }> = {
  1: { label: 'مسودة', color: 'warning' },
  2: { label: 'معتمد', color: 'info' },
  3: { label: 'مدفوع', color: 'success' },
  4: { label: 'ملغي', color: 'danger' },
};
const ITEM_TYPE_LABELS: Record<number, { label: string; isPositive: boolean }> = {
  1: { label: 'بدل', isPositive: true },
  2: { label: 'خصم', isPositive: false },
  3: { label: 'مكافأة', isPositive: true },
  4: { label: 'إضافي', isPositive: true },
  5: { label: 'سلفة', isPositive: false },
  6: { label: 'جزاء', isPositive: false },
};

type Tab = 'current' | 'history' | 'generate';

export function PayrollScreen() {
  const now = new Date();
  const [tab, setTab] = useState<Tab>('current');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [viewPayrollId, setViewPayrollId] = useState<number | null>(null);
  const [showPayModal, setShowPayModal] = useState<PayrollDetailDto | null>(null);
  const [viewPayslipId, setViewPayslipId] = useState<number | null>(null);

  const { data: payrollData, isLoading } = usePayrolls({ month, year, page: 1, pageSize: 200 });
  const { data: historyData, isLoading: historyLoading } = usePayrollHistory(year);

  const payrolls = ((payrollData as any)?.items ?? payrollData ?? []) as PayrollDetailDto[];
  const history = (historyData ?? []) as PayrollMonthSummaryDto[];

  const goMonth = (dir: number) => {
    let m = month + dir, y = year;
    if (m > 12) { m = 1; y++; } else if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const stats = useMemo(() => ({
    totalNet: payrolls.reduce((s, p) => s + p.netSalary, 0),
    totalBasic: payrolls.reduce((s, p) => s + p.basicSalary, 0),
    totalAllowances: payrolls.reduce((s, p) => s + p.allowances, 0),
    totalDeductions: payrolls.reduce((s, p) => s + p.deductions, 0),
    paidCount: payrolls.filter(p => p.isPaid).length,
    draftCount: payrolls.filter(p => p.status === 1).length,
    approvedCount: payrolls.filter(p => p.status === 2).length,
  }), [payrolls]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Banknote size={28} className="text-brand-600" />
            الرواتب والشيكات
          </h1>
          <p className="text-gray-500 text-sm mt-1">إدارة رواتب الموظفين وإصدار الشيكات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الرواتب', value: formatCurrency(stats.totalNet), icon: DollarSign, color: 'bg-brand-600' },
          { label: 'البدلات', value: formatCurrency(stats.totalAllowances), icon: TrendingUp, color: 'bg-emerald-600' },
          { label: 'الخصومات', value: formatCurrency(stats.totalDeductions), icon: AlertCircle, color: 'bg-red-500' },
          { label: 'تم الدفع', value: `${stats.paidCount}/${payrolls.length}`, icon: CheckCircle2, color: 'bg-blue-500' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between card p-3">
        <button onClick={() => goMonth(-1)} className="p-2 rounded-lg hover:bg-gray-100"><ChevronRight size={20} /></button>
        <span className="font-bold text-gray-900">{MONTHS[month - 1]} {year}</span>
        <button onClick={() => goMonth(1)} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft size={20} /></button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { id: 'current' as Tab, label: 'كشف الرواتب', icon: FileText },
          { id: 'history' as Tab, label: 'سجل الرواتب', icon: CalendarDays },
          { id: 'generate' as Tab, label: 'إنشاء كشف جديد', icon: Plus },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'current' && (
        <CurrentPayrollTab payrolls={payrolls} isLoading={isLoading}
          onView={setViewPayrollId} onPay={setShowPayModal} onPayslip={setViewPayslipId} />
      )}
      {tab === 'history' && <HistoryTab data={history} isLoading={historyLoading} year={year} />}
      {tab === 'generate' && <GenerateTab month={month} year={year} />}

      {/* Payroll Detail Modal */}
      {viewPayrollId && <PayrollDetailModal id={viewPayrollId} onClose={() => setViewPayrollId(null)} />}

      {/* Pay Modal */}
      {showPayModal && <PayModal payroll={showPayModal} onClose={() => setShowPayModal(null)} />}

      {/* Payslip Modal */}
      {viewPayslipId && <PayslipModal id={viewPayslipId} onClose={() => setViewPayslipId(null)} />}
    </div>
  );
}

// ==================== Current Payroll Tab ====================
function CurrentPayrollTab({ payrolls, isLoading, onView, onPay, onPayslip }: {
  payrolls: PayrollDetailDto[]; isLoading: boolean;
  onView: (id: number) => void; onPay: (p: PayrollDetailDto) => void; onPayslip: (id: number) => void;
}) {
  const approvePayroll = useApprovePayroll();
  const deletePayroll = useDeletePayroll();
  const [selected, setSelected] = useState<number[]>([]);

  const toggleSelect = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === payrolls.length ? [] : payrolls.map(p => p.id));

  const draftIds = payrolls.filter(p => p.status === 1 && selected.includes(p.id)).map(p => p.id);

  if (isLoading) return <LoadingSkeleton />;
  if (!payrolls.length) return <EmptyState message="لا يوجد كشف رواتب لهذا الشهر — استخدم 'إنشاء كشف جديد'" />;

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {draftIds.length > 0 && (
        <div className="card p-3 bg-blue-50 border-blue-100 flex items-center justify-between">
          <span className="text-sm text-blue-700">تم تحديد {draftIds.length} كشف في حالة مسودة</span>
          <button onClick={() => approvePayroll.mutate(draftIds, { onSuccess: () => setSelected([]) })}
            disabled={approvePayroll.isPending}
            className="btn-primary text-xs flex items-center gap-1">
            <Check size={14} /> اعتماد المحدد
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="py-3 px-3 w-10">
                  <input type="checkbox" checked={selected.length === payrolls.length && payrolls.length > 0}
                    onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">الموظف</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">الراتب الأساسي</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">البدلات</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">الخصومات</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">صافي الراتب</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">الحالة</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p) => {
                const st = STATUS_MAP[p.status] ?? STATUS_FALLBACK;
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-3">
                      <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{p.employeeName}</p>
                        {p.department && <p className="text-xs text-gray-400">{p.department}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{formatCurrency(p.basicSalary)}</td>
                    <td className="py-3 px-4 text-sm text-emerald-600 font-bold">+{formatCurrency(p.allowances)}</td>
                    <td className="py-3 px-4 text-sm text-red-600 font-bold">-{formatCurrency(p.deductions)}</td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900">{formatCurrency(p.netSalary)}</td>
                    <td className="py-3 px-4"><Badge variant={st.color}>{st.label}</Badge></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => onView(p.id)} title="التفاصيل"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Eye size={14} /></button>
                        {p.status === 2 && (
                          <button onClick={() => onPay(p)} title="إصدار شيك"
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"><CreditCard size={14} /></button>
                        )}
                        {p.isPaid && (
                          <button onClick={() => onPayslip(p.id)} title="كشف الراتب"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Printer size={14} /></button>
                        )}
                        {!p.isPaid && (
                          <button onClick={() => { if (confirm('حذف كشف الراتب؟')) deletePayroll.mutate(p.id); }} title="حذف"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td colSpan={2} className="py-3 px-4 text-sm text-gray-700">الإجمالي</td>
                <td className="py-3 px-4 text-sm">{formatCurrency(payrolls.reduce((s, p) => s + p.basicSalary, 0))}</td>
                <td className="py-3 px-4 text-sm text-emerald-600">+{formatCurrency(payrolls.reduce((s, p) => s + p.allowances, 0))}</td>
                <td className="py-3 px-4 text-sm text-red-600">-{formatCurrency(payrolls.reduce((s, p) => s + p.deductions, 0))}</td>
                <td className="py-3 px-4 text-sm">{formatCurrency(payrolls.reduce((s, p) => s + p.netSalary, 0))}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==================== History Tab ====================
function HistoryTab({ data, isLoading, year }: { data: PayrollMonthSummaryDto[]; isLoading: boolean; year: number }) {
  if (isLoading) return <LoadingSkeleton />;
  if (!data.length) return <EmptyState message="لا يوجد سجل رواتب" />;

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">سجل الرواتب — {year}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="py-3 px-4 text-xs font-semibold text-gray-500">الشهر</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500">عدد الموظفين</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500">الرواتب الأساسية</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500">البدلات</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500">الخصومات</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500">الصافي</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={`${row.month}-${row.year}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-3 px-4 font-bold text-gray-900">{MONTHS[row.month - 1]} {row.year}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{row.employeeCount}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{formatCurrency(row.totalBasicSalary)}</td>
                <td className="py-3 px-4 text-sm text-emerald-600">+{formatCurrency(row.totalAllowances)}</td>
                <td className="py-3 px-4 text-sm text-red-600">-{formatCurrency(row.totalDeductions)}</td>
                <td className="py-3 px-4 text-sm font-bold text-gray-900">{formatCurrency(row.totalNet)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-600 font-bold">{row.paidCount} مدفوع</span>
                    {row.unpaidCount > 0 && <span className="text-amber-600 font-bold">{row.unpaidCount} معلق</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== Generate Tab ====================
function GenerateTab({ month, year }: { month: number; year: number }) {
  const { data: employees } = useEmployees();
  const generate = useGeneratePayroll();
  const [selectedEmps, setSelectedEmps] = useState<number[]>([]);
  const [allEmployees, setAllEmployees] = useState(true);

  const handleGenerate = () => {
    generate.mutate({
      month, year,
      employeeIds: allEmployees ? undefined : selectedEmps.length > 0 ? selectedEmps : undefined,
    });
  };

  return (
    <div className="card p-6 space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
          <FileText size={32} className="text-brand-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">إنشاء كشف رواتب</h3>
        <p className="text-gray-500 mt-1">لشهر {MONTHS[month - 1]} {year}</p>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-bold">سيتم تلقائياً:</p>
        <ul className="list-disc list-inside text-xs space-y-1">
          <li>حساب الراتب الأساسي + البدلات من إعدادات كل موظف</li>
          <li>احتساب خصومات الغياب بناءً على سجل الحضور</li>
          <li>تطبيق بنود الراتب المخصصة (مكافآت، خصومات، إضافي)</li>
          <li>تجاهل الموظفين الذين لديهم كشف راتب بالفعل لهذا الشهر</li>
        </ul>
      </div>

      <div>
        <label className="flex items-center gap-2 mb-3">
          <input type="checkbox" checked={allEmployees} onChange={(e) => setAllEmployees(e.target.checked)} className="rounded border-gray-300" />
          <span className="text-sm font-medium text-gray-700">جميع الموظفين النشطين</span>
        </label>
        {!allEmployees && (
          <div className="border rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
            {(employees ?? []).map((emp: any) => (
              <label key={emp.id} className="flex items-center gap-2 py-1 hover:bg-gray-50 px-2 rounded-lg cursor-pointer">
                <input type="checkbox" checked={selectedEmps.includes(emp.id)}
                  onChange={() => setSelectedEmps(s => s.includes(emp.id) ? s.filter(x => x !== emp.id) : [...s, emp.id])}
                  className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">{emp.name}</span>
                <span className="text-xs text-gray-400 mr-auto">{formatCurrency(emp.basicSalary)}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleGenerate} disabled={generate.isPending}
        className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
        {generate.isPending ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
        إنشاء كشف الرواتب
      </button>

      {generate.isSuccess && (
        <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-700 text-center font-bold">
          تم إنشاء كشف الرواتب بنجاح — انتقل لتبويب "كشف الرواتب" للمراجعة والاعتماد
        </div>
      )}
    </div>
  );
}

// ==================== Pay Modal ====================
function PayModal({ payroll, onClose }: { payroll: PayrollDetailDto; onClose: () => void }) {
  const pay = usePayPayroll();
  const [form, setForm] = useState({
    payrollId: payroll.id,
    checkNumber: '',
    bankName: '',
    accountNumber: '',
    cashDate: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pay.mutate(form, { onSuccess: () => onClose() });
  };

  return (
    <Modal onClose={onClose} title={`إصدار شيك — ${payroll.employeeName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-brand-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-600">المبلغ المستحق</p>
          <p className="text-2xl font-bold text-brand-700">{formatCurrency(payroll.netSalary)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">رقم الشيك</label>
            <input type="text" value={form.checkNumber} onChange={(e) => setForm(f => ({ ...f, checkNumber: e.target.value }))}
              className="input" placeholder="تلقائي إن فارغ" />
          </div>
          <div>
            <label className="label">اسم البنك</label>
            <input type="text" value={form.bankName} onChange={(e) => setForm(f => ({ ...f, bankName: e.target.value }))}
              className="input" placeholder="مثال: الراجحي" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">رقم الحساب</label>
            <input type="text" value={form.accountNumber} onChange={(e) => setForm(f => ({ ...f, accountNumber: e.target.value }))}
              className="input" />
          </div>
          <div>
            <label className="label">تاريخ الصرف</label>
            <input type="date" value={form.cashDate} onChange={(e) => setForm(f => ({ ...f, cashDate: e.target.value }))}
              className="input" />
          </div>
        </div>
        <div>
          <label className="label">ملاحظات</label>
          <input type="text" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
            className="input" placeholder="اختياري" />
        </div>
        <div className="flex gap-3 pt-4 border-t">
          <button type="submit" disabled={pay.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {pay.isPending ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
            إصدار الشيك
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
        </div>
      </form>
    </Modal>
  );
}

// ==================== Payroll Detail Modal ====================
function PayrollDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: payroll, isLoading } = usePayrolls({ page: 1, pageSize: 1 }); // we'll just use the list data for now

  return (
    <Modal onClose={onClose} title="تفاصيل كشف الراتب" wide>
      {isLoading ? (
        <Loader2 size={32} className="animate-spin mx-auto text-brand-600" />
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>معرف الكشف: {id}</p>
          <p className="text-sm mt-2">استخدم زر كشف الراتب للطباعة</p>
        </div>
      )}
    </Modal>
  );
}

// ==================== Payslip Modal ====================
function PayslipModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: payslip, isLoading } = usePayslip(id);

  const handlePrint = () => window.print();

  if (isLoading) return (
    <Modal onClose={onClose} title="كشف الراتب">
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    </Modal>
  );

  if (!payslip) return (
    <Modal onClose={onClose} title="كشف الراتب">
      <div className="text-center py-8 text-red-500">لم يتم العثور على كشف الراتب</div>
    </Modal>
  );

  const slip = payslip as PayslipDto;

  return (
    <Modal onClose={onClose} title="كشف الراتب" wide>
      <div className="space-y-6 print:p-0" id="payslip-content">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{slip.companyName}</h2>
            {slip.companyAddress && <p className="text-sm text-gray-500">{slip.companyAddress}</p>}
            {slip.companyPhone && <p className="text-sm text-gray-500">{slip.companyPhone}</p>}
          </div>
          <div className="text-left">
            <h3 className="font-bold text-brand-700">كشف راتب</h3>
            <p className="text-sm text-gray-600">{MONTHS[slip.month - 1]} {slip.year}</p>
          </div>
        </div>

        {/* Employee Info */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">الاسم:</span> <strong>{slip.employeeName}</strong></p>
            <p><span className="text-gray-500">القسم:</span> {slip.department ?? '—'}</p>
            <p><span className="text-gray-500">المنصب:</span> {slip.position ?? '—'}</p>
          </div>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">البنك:</span> {slip.bankName ?? '—'}</p>
            <p><span className="text-gray-500">رقم الحساب:</span> {slip.bankAccount ?? '—'}</p>
            <p><span className="text-gray-500">IBAN:</span> {slip.iban ?? '—'}</p>
          </div>
        </div>

        {/* Attendance */}
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { label: 'أيام العمل', value: slip.workingDays, color: 'text-gray-700' },
            { label: 'حضور', value: slip.presentDays, color: 'text-emerald-600' },
            { label: 'غياب', value: slip.absentDays, color: 'text-red-600' },
            { label: 'تأخير', value: slip.lateDays, color: 'text-amber-600' },
          ].map((item) => (
            <div key={item.label} className="card p-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Earnings & Deductions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-bold text-emerald-700 mb-2 text-sm">المستحقات</h4>
            <div className="space-y-1">
              {slip.earnings.map((e, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50">
                  <span className="text-gray-700">{e.description}</span>
                  <span className="font-bold text-gray-900">{formatCurrency(e.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 font-bold text-emerald-700 border-t border-emerald-200">
                <span>إجمالي المستحقات</span>
                <span>{formatCurrency(slip.totalEarnings)}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-red-700 mb-2 text-sm">الاستقطاعات</h4>
            <div className="space-y-1">
              {slip.deductionItems.length > 0 ? slip.deductionItems.map((d, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50">
                  <span className="text-gray-700">{d.description}</span>
                  <span className="font-bold text-gray-900">{formatCurrency(d.amount)}</span>
                </div>
              )) : (
                <p className="text-sm text-gray-400 py-2">لا توجد استقطاعات</p>
              )}
              <div className="flex justify-between text-sm pt-2 font-bold text-red-700 border-t border-red-200">
                <span>إجمالي الاستقطاعات</span>
                <span>{formatCurrency(slip.totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Salary */}
        <div className="bg-brand-50 rounded-xl p-5 text-center border-2 border-brand-200">
          <p className="text-sm text-gray-600">صافي الراتب المستحق</p>
          <p className="text-3xl font-bold text-brand-700">{formatCurrency(slip.netSalary)}</p>
          {slip.checkNumber && (
            <p className="text-xs text-gray-500 mt-2">رقم الشيك: {slip.checkNumber} | تاريخ الدفع: {slip.paymentDate ? formatDate(slip.paymentDate) : '—'}</p>
          )}
        </div>

        {/* Print */}
        <div className="flex gap-3 print:hidden">
          <button onClick={handlePrint} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Printer size={18} />
            طباعة
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">إغلاق</button>
        </div>
      </div>
    </Modal>
  );
}

// ==================== Shared Components ====================
function Modal({ onClose, title, children, wide }: { onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}
        dir="rtl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={20} /></button>
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
        <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="card py-12 text-center">
      <Banknote size={48} className="mx-auto text-gray-300 mb-4" />
      <p className="text-gray-500 font-medium">{message}</p>
    </div>
  );
}
