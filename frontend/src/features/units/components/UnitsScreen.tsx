import { useState, useMemo } from 'react';
import { Ruler, Plus, Edit2, Trash2, ArrowLeftRight, AlertCircle, Search, X } from 'lucide-react';
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from '@/hooks/useApi';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import type { UnitDto, CreateUnitRequest, UpdateUnitRequest } from '@/types/api.types';
import { unitsApi } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

export function UnitsScreen() {
  const { data: units, isLoading, isError, refetch } = useUnits();
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitDto | null>(null);
  const [showConverter, setShowConverter] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!units) return [];
    if (!search) return units;
    const q = search.toLowerCase();
    return units.filter(u => u.name.toLowerCase().includes(q) || u.symbol?.toLowerCase().includes(q));
  }, [units, search]);

  const baseUnits = useMemo(() => (units ?? []).filter(u => u.isBase), [units]);
  const subUnits = useMemo(() => (units ?? []).filter(u => !u.isBase), [units]);

  const handleEdit = (unit: UnitDto) => { setEditingUnit(unit); setShowForm(true); };
  const handleClose = () => { setShowForm(false); setEditingUnit(null); };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Ruler size={28} className="text-brand-600" />
            وحدات القياس
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إدارة وحدات القياس ومعاملات التحويل بينها</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowConverter(true)}
            className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowLeftRight size={16} /> محوّل الوحدات
          </button>
          <button onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> إضافة وحدة
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 bg-gradient-to-l from-brand-50 to-white dark:from-brand-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي الوحدات</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{isLoading ? '...' : (units ?? []).length}</p>
        </div>
        <div className="card p-4 bg-gradient-to-l from-emerald-50 to-white dark:from-emerald-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">وحدات أساسية</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{isLoading ? '...' : baseUnits.length}</p>
        </div>
        <div className="card p-4 bg-gradient-to-l from-amber-50 to-white dark:from-amber-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">وحدات فرعية</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{isLoading ? '...' : subUnits.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الرمز..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Units Table */}
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
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Ruler size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {search ? 'لا توجد نتائج للبحث' : 'لا توجد وحدات قياس بعد'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الوحدة</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الرمز</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">النوع</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الوحدة الأساسية</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">معامل التحويل</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(unit => (
                  <UnitRow key={unit.id} unit={unit} onEdit={handleEdit} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <UnitFormModal
          unit={editingUnit}
          baseUnits={baseUnits}
          onClose={handleClose}
        />
      )}

      {/* Converter Modal */}
      {showConverter && (
        <ConvertModal units={units ?? []} onClose={() => setShowConverter(false)} />
      )}
    </div>
  );
}

// ─── Unit Row ───────────────────────────────────
function UnitRow({ unit, onEdit }: { unit: UnitDto; onEdit: (u: UnitDto) => void }) {
  const deleteMut = useDeleteUnit();

  return (
    <tr className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-sm shrink-0">
            {unit.symbol || unit.name.charAt(0)}
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-100">{unit.name}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 font-mono">{unit.symbol ?? '—'}</td>
      <td className="py-3 px-4">
        <Badge variant={unit.isBase ? 'success' : 'default'}>
          {unit.isBase ? 'أساسية' : 'فرعية'}
        </Badge>
      </td>
      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{unit.baseUnitName ?? '—'}</td>
      <td className="py-3 px-4 text-sm font-mono text-gray-700 dark:text-gray-300">
        {unit.conversionRate != null ? unit.conversionRate : '—'}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(unit)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition" title="تعديل">
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => { if (confirm(`حذف "${unit.name}"؟`)) deleteMut.mutate(unit.id); }}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-400 transition" title="حذف">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Form Modal ───────────────────────────────────
function UnitFormModal({ unit, baseUnits, onClose }: { unit: UnitDto | null; baseUnits: UnitDto[]; onClose: () => void }) {
  const createMut = useCreateUnit();
  const updateMut = useUpdateUnit();

  const [form, setForm] = useState({
    name: unit?.name ?? '',
    symbol: unit?.symbol ?? '',
    isBase: unit?.isBase ?? true,
    baseUnitId: unit?.baseUnitId ?? undefined as number | undefined,
    conversionRate: unit?.conversionRate ?? undefined as number | undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('اسم الوحدة مطلوب');

    if (unit) {
      updateMut.mutate({ id: unit.id, data: form as UpdateUnitRequest }, { onSuccess: onClose });
    } else {
      createMut.mutate(form as CreateUnitRequest, { onSuccess: onClose });
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <Modal open onClose={onClose} title={unit ? 'تعديل وحدة القياس' : 'إضافة وحدة قياس جديدة'}>
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اسم الوحدة *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
              placeholder="مثال: كيلوجرام" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الرمز</label>
            <input value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
              placeholder="مثال: kg" dir="ltr" />
          </div>
        </div>

        {/* Type toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع الوحدة</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setForm(f => ({ ...f, isBase: true, baseUnitId: undefined, conversionRate: undefined }))}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition ${
                form.isBase ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300' : 'border-gray-200 dark:border-gray-700 text-gray-500'
              }`}>
              وحدة أساسية
            </button>
            <button type="button" onClick={() => setForm(f => ({ ...f, isBase: false }))}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition ${
                !form.isBase ? 'border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300' : 'border-gray-200 dark:border-gray-700 text-gray-500'
              }`}>
              وحدة فرعية (تحويل)
            </button>
          </div>
        </div>

        {/* Conversion fields — only when sub-unit */}
        {!form.isBase && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الوحدة الأساسية المرجعية *</label>
              <select value={form.baseUnitId ?? ''} onChange={e => setForm(f => ({ ...f, baseUnitId: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500">
                <option value="">اختر الوحدة الأساسية</option>
                {baseUnits.filter(b => b.id !== unit?.id).map(b => (
                  <option key={b.id} value={b.id}>{b.name} {b.symbol ? `(${b.symbol})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">معامل التحويل *</label>
              <input type="number" step="any" min="0" value={form.conversionRate ?? ''}
                onChange={e => setForm(f => ({ ...f, conversionRate: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
                placeholder="مثال: 0.001 (جرام → كيلو)" dir="ltr" />
              <p className="text-xs text-gray-400 mt-1">= كم من الوحدة الأساسية في هذه الوحدة</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-3 border-t dark:border-gray-700">
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition disabled:opacity-50">
            {saving ? 'جارٍ الحفظ...' : unit ? 'تحديث' : 'إنشاء'}
          </button>
          <button type="button" onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Converter Modal ───────────────────────────────
function ConvertModal({ units, onClose }: { units: UnitDto[]; onClose: () => void }) {
  const [fromId, setFromId] = useState<number | ''>('');
  const [toId, setToId] = useState<number | ''>('');
  const [qty, setQty] = useState('1');
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConvert = async () => {
    if (!fromId || !toId || !qty) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await unitsApi.convert(Number(fromId), Number(toId), Number(qty));
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.errors?.join(', ') || 'خطأ في التحويل');
      }
    } catch {
      setError('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const fromUnit = units.find(u => u.id === Number(fromId));
  const toUnit = units.find(u => u.id === Number(toId));

  return (
    <Modal open onClose={onClose} title="محوّل وحدات القياس">
      <div className="space-y-4 p-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">من وحدة</label>
            <select value={fromId} onChange={e => { setFromId(e.target.value ? Number(e.target.value) : ''); setResult(null); }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500">
              <option value="">اختر</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name} {u.symbol ? `(${u.symbol})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">إلى وحدة</label>
            <select value={toId} onChange={e => { setToId(e.target.value ? Number(e.target.value) : ''); setResult(null); }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500">
              <option value="">اختر</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name} {u.symbol ? `(${u.symbol})` : ''}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الكمية</label>
          <input type="number" value={qty} onChange={e => { setQty(e.target.value); setResult(null); }}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
            dir="ltr" />
        </div>

        <button onClick={handleConvert} disabled={loading || !fromId || !toId}
          className="w-full py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition disabled:opacity-50">
          {loading ? 'جارٍ التحويل...' : 'تحويل'}
        </button>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {result !== null && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">النتيجة</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {qty} {fromUnit?.symbol || fromUnit?.name} = {result} {toUnit?.symbol || toUnit?.name}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
