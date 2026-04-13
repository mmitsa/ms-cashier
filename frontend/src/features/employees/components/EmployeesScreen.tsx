import { useState } from 'react';
import {
  UserPlus, X, Loader2, AlertCircle, Phone, Briefcase, Calendar,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useEmployees, useCreateEmployee } from '@/hooks/useApi';
import { formatCurrency, formatDate } from '@/lib/utils/cn';
import type { EmployeeDto, CreateEmployeeRequest } from '@/types/api.types';

export function EmployeesScreen() {
  const { data: employees, isLoading, isError, refetch } = useEmployees();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">الموظفون</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إدارة بيانات الموظفين</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary shrink-0">
          <UserPlus size={18} />
          إضافة موظف
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-l from-brand-50 to-white dark:from-brand-950 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الموظفين</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isLoading ? '...' : (employees ?? []).length}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-gradient-to-l from-emerald-50 to-white dark:from-emerald-950 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Briefcase size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">نشط</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isLoading ? '...' : (employees ?? []).filter((e) => e.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-gradient-to-l from-amber-50 to-white dark:from-amber-950 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Calendar size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الرواتب</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isLoading ? '...' : formatCurrency((employees ?? []).reduce((s, e) => s + e.basicSalary, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-red-500">
            <AlertCircle size={40} />
            <p className="font-semibold">حدث خطأ أثناء تحميل البيانات</p>
            <button onClick={() => refetch()} className="btn-secondary text-sm">إعادة المحاولة</button>
          </div>
        ) : (employees ?? []).length === 0 ? (
          <div className="py-12 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">لا يوجد موظفون بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الاسم</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الهاتف</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">المنصب</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">القسم</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الراتب</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">تاريخ التعيين</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {(employees ?? []).map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-sm shrink-0">
                          {employee.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{employee.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {employee.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone size={14} className="text-gray-400" />
                          {employee.phone}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{employee.position ?? '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{employee.department ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(employee.basicSalary)}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(employee.hireDate)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={employee.isActive ? 'success' : 'danger'}>
                        {employee.isActive ? 'نشط' : 'متوقف'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <AddEmployeeModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

// ==================== Add Employee Modal ====================

function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  const createEmployee = useCreateEmployee();
  const [form, setForm] = useState<CreateEmployeeRequest>({
    name: '',
    phone: '',
    position: '',
    department: '',
    basicSalary: 0,
    hireDate: new Date().toISOString().split('T')[0] ?? '',
  });

  const updateField = <K extends keyof CreateEmployeeRequest>(key: K, value: CreateEmployeeRequest[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createEmployee.mutate(form, { onSuccess: () => onClose() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">إضافة موظف جديد</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الاسم <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
              placeholder="اسم الموظف"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الهاتف</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 outline-none text-sm"
                placeholder="01xxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المنصب</label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => updateField('position', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 outline-none text-sm"
                placeholder="مثال: كاشير"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">القسم</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => updateField('department', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 outline-none text-sm"
                placeholder="مثال: المبيعات"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                الراتب <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.basicSalary || ''}
                onChange={(e) => updateField('basicSalary', Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 outline-none text-sm"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ التعيين</label>
            <input
              type="date"
              value={form.hireDate}
              onChange={(e) => updateField('hireDate', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:border-brand-500 outline-none text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              disabled={createEmployee.isPending || !form.name.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {createEmployee.isPending ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              حفظ
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}
