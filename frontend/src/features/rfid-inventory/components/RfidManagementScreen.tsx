import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ScanLine, Plus, Trash2, AlertCircle, Search, Tag, QrCode,
  ClipboardList, BarChart3, Play, Download, Printer,
  Package, Warehouse, Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { rfidInventoryApi } from '@/lib/api/endpoints';
import { warehousesApi } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

// ─── Tab Type ──────────────────────────────────────────

type TabId = 'rfid-tags' | 'qr-codes' | 'scan-sessions' | 'reports';

const tabs: { id: TabId; label: string; icon: typeof Tag }[] = [
  { id: 'rfid-tags', label: 'تاجات RFID', icon: Tag },
  { id: 'qr-codes', label: 'رموز QR', icon: QrCode },
  { id: 'scan-sessions', label: 'جلسات الجرد', icon: ClipboardList },
  { id: 'reports', label: 'تقارير', icon: BarChart3 },
];

// ─── Main Screen ───────────────────────────────────────

export function RfidManagementScreen() {
  const [activeTab, setActiveTab] = useState<TabId>('rfid-tags');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ScanLine size={28} className="text-brand-600" />
            جرد RFID و QR
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            إدارة تاجات RFID ورموز QR وجلسات الجرد الآلي
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'rfid-tags' && <RfidTagsTab />}
      {activeTab === 'qr-codes' && <QrCodesTab />}
      {activeTab === 'scan-sessions' && <ScanSessionsTab />}
      {activeTab === 'reports' && <ReportsTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab 1: RFID Tags
// ═══════════════════════════════════════════════════════════

function RfidTagsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: tagsRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['rfid-tags'],
    queryFn: () => rfidInventoryApi.getTags(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => rfidInventoryApi.deleteTag(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم حذف التاج');
        queryClient.invalidateQueries({ queryKey: ['rfid-tags'] });
      } else {
        toast.error(res.errors?.[0] || 'خطأ');
      }
    },
  });

  const tags = tagsRes?.data ?? [];
  const filtered = useMemo(() => {
    if (!search) return tags;
    const q = search.toLowerCase();
    return tags.filter(
      (t: any) =>
        t.rfidTagId?.toLowerCase().includes(q) ||
        t.productName?.toLowerCase().includes(q) ||
        t.shelfLocation?.toLowerCase().includes(q)
    );
  }, [tags, search]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 bg-gradient-to-l from-brand-50 to-white dark:from-brand-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي التاجات</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{tags.length}</p>
        </div>
        <div className="card p-4 bg-gradient-to-l from-emerald-50 to-white dark:from-emerald-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">نشطة</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {tags.filter((t: any) => t.isActive).length}
          </p>
        </div>
        <div className="card p-4 bg-gradient-to-l from-blue-50 to-white dark:from-blue-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">تم مسحها مؤخراً</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {tags.filter((t: any) => t.lastScannedAt).length}
          </p>
        </div>
        <div className="card p-4 bg-gradient-to-l from-amber-50 to-white dark:from-amber-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">نوع UHF</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {tags.filter((t: any) => t.tagType === 'UHF').length}
          </p>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالتاج أو اسم المنتج أو الموقع..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> إضافة تاج
        </button>
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
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Tag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {search ? 'لا توجد نتائج للبحث' : 'لا توجد تاجات RFID بعد'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">رقم التاج</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">المنتج</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">النوع</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">المخزن</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الموقع</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">آخر مسح</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tag: any) => (
                  <tr key={tag.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-brand-600 dark:text-brand-400">{tag.rfidTagId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300">
                          <Package size={14} />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{tag.productName ?? '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={tag.tagType === 'UHF' ? 'primary' : 'info'}>{tag.tagType}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{tag.warehouseName ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{tag.shelfLocation ?? '—'}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {tag.lastScannedAt
                        ? new Date(tag.lastScannedAt).toLocaleDateString('ar-SA')
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => { if (confirm(`حذف التاج "${tag.rfidTagId}"؟`)) deleteMut.mutate(tag.id); }}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-400 transition"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <AddTagModal onClose={() => setShowForm(false)} />}
    </div>
  );
}

// ─── Add Tag Modal ─────────────────────────────────────

function AddTagModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: whRes } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.getAll(),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => rfidInventoryApi.createTag(data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || 'تم إضافة التاج');
        queryClient.invalidateQueries({ queryKey: ['rfid-tags'] });
        onClose();
      } else {
        toast.error(res.errors?.[0] || 'خطأ');
      }
    },
  });

  const [form, setForm] = useState({
    productId: '' as string | number,
    rfidTagId: '',
    tagType: 'UHF',
    warehouseId: '' as string | number,
    shelfLocation: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.rfidTagId) return toast.error('يجب تحديد المنتج ورقم التاج');
    createMut.mutate({
      productId: Number(form.productId),
      rfidTagId: form.rfidTagId,
      tagType: form.tagType,
      warehouseId: form.warehouseId ? Number(form.warehouseId) : undefined,
      shelfLocation: form.shelfLocation || undefined,
    });
  };

  const warehouses = whRes?.data ?? [];

  return (
    <Modal open onClose={onClose} title="إضافة تاج RFID جديد">
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">رقم المنتج *</label>
            <input
              type="number"
              value={form.productId}
              onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
              placeholder="معرّف المنتج"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">رقم التاج RFID *</label>
            <input
              value={form.rfidTagId}
              onChange={(e) => setForm((f) => ({ ...f, rfidTagId: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
              placeholder="EPC Tag ID"
              dir="ltr"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">نوع التاج</label>
            <select
              value={form.tagType}
              onChange={(e) => setForm((f) => ({ ...f, tagType: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
            >
              <option value="UHF">UHF</option>
              <option value="HF">HF</option>
              <option value="NFC">NFC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">المخزن</label>
            <select
              value={form.warehouseId}
              onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
            >
              <option value="">اختر المخزن</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الموقع (الرف)</label>
            <input
              value={form.shelfLocation}
              onChange={(e) => setForm((f) => ({ ...f, shelfLocation: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
              placeholder="A1-R3-S5"
              dir="ltr"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-3 border-t dark:border-gray-700">
          <button
            type="submit"
            disabled={createMut.isPending}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition disabled:opacity-50"
          >
            {createMut.isPending ? 'جارٍ الحفظ...' : 'إضافة التاج'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab 2: QR Codes
// ═══════════════════════════════════════════════════════════

function QrCodesTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: qrRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['rfid-qr-codes'],
    queryFn: () => rfidInventoryApi.getQrCodes(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => rfidInventoryApi.deleteQrCode(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم حذف رمز QR');
        queryClient.invalidateQueries({ queryKey: ['rfid-qr-codes'] });
      } else {
        toast.error(res.errors?.[0] || 'خطأ');
      }
    },
  });

  const codes = qrRes?.data ?? [];

  const qrTypeLabels: Record<string, string> = {
    warehouse: 'مخزن',
    zone: 'منطقة',
    shelf: 'رف',
    bin: 'حاوية',
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 bg-gradient-to-l from-brand-50 to-white dark:from-brand-950 dark:to-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي الرموز</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{codes.length}</p>
        </div>
        {['warehouse', 'zone', 'shelf', 'bin'].slice(0, 3).map((type) => (
          <div key={type} className="card p-4 bg-gradient-to-l from-blue-50 to-white dark:from-blue-950 dark:to-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">{qrTypeLabels[type]}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {codes.filter((c: any) => c.qrType === type).length}
            </p>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> إنشاء رمز QR
        </button>
      </div>

      {/* Table */}
      <div className="card p-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-red-500">
            <AlertCircle size={40} />
            <p className="font-semibold">حدث خطأ أثناء تحميل البيانات</p>
            <button onClick={() => refetch()} className="btn-secondary text-sm">إعادة المحاولة</button>
          </div>
        ) : codes.length === 0 ? (
          <div className="py-12 text-center">
            <QrCode size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">لا توجد رموز QR بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">كود الموقع</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">النوع</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">المخزن</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الوصف</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code: any) => (
                  <tr key={code.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300">
                          <QrCode size={16} />
                        </div>
                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{code.locationCode}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="info">{qrTypeLabels[code.qrType] ?? code.qrType}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{code.warehouseName ?? '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{code.description ?? '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(code.qrCodeData);
                            toast.success('تم نسخ بيانات QR');
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition"
                          title="نسخ بيانات QR"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(`
                                <html dir="rtl"><head><title>QR: ${code.locationCode}</title></head>
                                <body style="text-align:center;padding:40px;font-family:sans-serif">
                                  <h2>رمز الموقع: ${code.locationCode}</h2>
                                  <p style="font-size:14px;color:#666">${code.warehouseName ?? ''} - ${qrTypeLabels[code.qrType] ?? code.qrType}</p>
                                  <div style="margin:30px auto;padding:20px;border:2px dashed #ccc;width:200px;height:200px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#999">
                                    [QR Code Placeholder]<br/>${code.locationCode}
                                  </div>
                                  <p style="font-size:11px;color:#aaa">${code.qrCodeData}</p>
                                </body></html>
                              `);
                              printWindow.document.close();
                              printWindow.print();
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition"
                          title="طباعة"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm(`حذف رمز QR "${code.locationCode}"؟`)) deleteMut.mutate(code.id); }}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-400 transition"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <AddQrCodeModal onClose={() => setShowForm(false)} />}
    </div>
  );
}

// ─── Add QR Code Modal ─────────────────────────────────

function AddQrCodeModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: whRes } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.getAll(),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => rfidInventoryApi.createQrCode(data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || 'تم إنشاء رمز QR');
        queryClient.invalidateQueries({ queryKey: ['rfid-qr-codes'] });
        onClose();
      } else {
        toast.error(res.errors?.[0] || 'خطأ');
      }
    },
  });

  const [form, setForm] = useState({
    warehouseId: '' as string | number,
    qrType: 'warehouse',
    locationCode: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.warehouseId || !form.locationCode) return toast.error('المخزن وكود الموقع مطلوبان');
    createMut.mutate({
      warehouseId: Number(form.warehouseId),
      qrType: form.qrType,
      locationCode: form.locationCode,
      description: form.description || undefined,
    });
  };

  const warehouses = whRes?.data ?? [];

  return (
    <Modal open onClose={onClose} title="إنشاء رمز QR جديد">
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">المخزن *</label>
            <select
              value={form.warehouseId}
              onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
            >
              <option value="">اختر المخزن</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">النوع</label>
            <select
              value={form.qrType}
              onChange={(e) => setForm((f) => ({ ...f, qrType: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
            >
              <option value="warehouse">مخزن</option>
              <option value="zone">منطقة</option>
              <option value="shelf">رف</option>
              <option value="bin">حاوية</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">كود الموقع *</label>
          <input
            value={form.locationCode}
            onChange={(e) => setForm((f) => ({ ...f, locationCode: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
            placeholder="WH01-Z02-S03"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الوصف</label>
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
            placeholder="وصف الموقع (اختياري)"
          />
        </div>

        <div className="flex gap-3 pt-3 border-t dark:border-gray-700">
          <button
            type="submit"
            disabled={createMut.isPending}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition disabled:opacity-50"
          >
            {createMut.isPending ? 'جارٍ الحفظ...' : 'إنشاء رمز QR'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab 3: Scan Sessions
// ═══════════════════════════════════════════════════════════

function ScanSessionsTab() {
  const queryClient = useQueryClient();
  const [showStart, setShowStart] = useState(false);
  const [viewingSession, setViewingSession] = useState<number | null>(null);

  const { data: sessionsRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['rfid-sessions'],
    queryFn: () => rfidInventoryApi.getSessions({ page: 1, pageSize: 50 }),
  });

  const sessions = sessionsRes?.data?.items ?? [];

  const statusBadge = (status: string) => {
    switch (status) {
      case 'InProgress': return <Badge variant="warning">جارٍ</Badge>;
      case 'Completed': return <Badge variant="success">مكتمل</Badge>;
      case 'Cancelled': return <Badge variant="danger">ملغى</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  const sessionTypeLabels: Record<string, string> = {
    full_count: 'جرد شامل',
    partial_count: 'جرد جزئي',
    spot_check: 'فحص عشوائي',
    qr_count: 'جرد QR',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">جلسات الجرد</h2>
        <button onClick={() => setShowStart(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Play size={16} /> بدء جلسة جديدة
        </button>
      </div>

      {/* Sessions List */}
      <div className="card p-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-red-500">
            <AlertCircle size={40} />
            <p className="font-semibold">حدث خطأ أثناء تحميل البيانات</p>
            <button onClick={() => refetch()} className="btn-secondary text-sm">إعادة المحاولة</button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">لا توجد جلسات جرد بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session: any) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300">
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        جلسة #{session.id}
                      </span>
                      {statusBadge(session.status)}
                      <Badge variant="default">{sessionTypeLabels[session.sessionType] ?? session.sessionType}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Warehouse size={11} /> {session.warehouseName ?? `مخزن ${session.warehouseId}`}
                      </span>
                      <span>{new Date(session.startedAt).toLocaleDateString('ar-SA')}</span>
                      {session.completedAt && (
                        <span>اكتمل: {new Date(session.completedAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Counts */}
                  <div className="hidden sm:flex items-center gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-400">ممسوح</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{session.totalTagsScanned}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-500">مطابق</p>
                      <p className="text-sm font-bold text-emerald-600">{session.matchedItems}</p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-500">غير مطابق</p>
                      <p className="text-sm font-bold text-amber-600">{session.unmatchedTags}</p>
                    </div>
                    <div>
                      <p className="text-xs text-red-500">مفقود</p>
                      <p className="text-sm font-bold text-red-600">{session.missingItems}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingSession(session.id)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition"
                    title="عرض التفاصيل"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showStart && <StartSessionModal onClose={() => { setShowStart(false); refetch(); }} />}
      {viewingSession && <SessionResultsModal sessionId={viewingSession} onClose={() => setViewingSession(null)} />}
    </div>
  );
}

// ─── Start Session Modal ───────────────────────────────

function StartSessionModal({ onClose }: { onClose: () => void }) {
  const { data: whRes } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.getAll(),
  });

  const startMut = useMutation({
    mutationFn: (data: { warehouseId: number; sessionType: string }) => rfidInventoryApi.startSession(data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || 'تم بدء جلسة الجرد');
        onClose();
      } else {
        toast.error(res.errors?.[0] || 'خطأ');
      }
    },
  });

  const [form, setForm] = useState({ warehouseId: '' as string | number, sessionType: 'full_count' });
  const warehouses = whRes?.data ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.warehouseId) return toast.error('يجب اختيار المخزن');
    startMut.mutate({ warehouseId: Number(form.warehouseId), sessionType: form.sessionType });
  };

  return (
    <Modal open onClose={onClose} title="بدء جلسة جرد جديدة">
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">المخزن *</label>
          <select
            value={form.warehouseId}
            onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm outline-none focus:border-brand-500"
          >
            <option value="">اختر المخزن</option>
            {warehouses.map((w: any) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع الجلسة</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'full_count', label: 'جرد شامل' },
              { value: 'partial_count', label: 'جرد جزئي' },
              { value: 'spot_check', label: 'فحص عشوائي' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, sessionType: opt.value }))}
                className={`py-2.5 rounded-xl text-sm font-medium border-2 transition ${
                  form.sessionType === opt.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-3 border-t dark:border-gray-700">
          <button
            type="submit"
            disabled={startMut.isPending}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition disabled:opacity-50"
          >
            {startMut.isPending ? 'جارٍ البدء...' : 'بدء الجلسة'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Session Results Modal ─────────────────────────────

function SessionResultsModal({ sessionId, onClose }: { sessionId: number; onClose: () => void }) {
  const { data: resultsRes, isLoading } = useQuery({
    queryKey: ['rfid-session-results', sessionId],
    queryFn: () => rfidInventoryApi.getSessionResults(sessionId),
  });

  const summary = resultsRes?.data;

  const resultTypeLabel = (type: string) => {
    switch (type) {
      case 'Matched': return { label: 'مطابق', variant: 'success' as const };
      case 'Misplaced': return { label: 'موقع خاطئ', variant: 'warning' as const };
      case 'Unknown': return { label: 'غير معروف', variant: 'danger' as const };
      case 'Missing': return { label: 'مفقود', variant: 'danger' as const };
      default: return { label: type, variant: 'default' as const };
    }
  };

  return (
    <Modal open onClose={onClose} title={`نتائج جلسة #${sessionId}`} size="xl">
      {isLoading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !summary ? (
        <div className="py-8 text-center text-gray-500">لا توجد بيانات</div>
      ) : (
        <div className="space-y-4 p-1">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-emerald-600 dark:text-emerald-400">مطابق</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{summary.matchedItems}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-600 dark:text-amber-400">موقع خاطئ</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{summary.misplacedItems}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400">غير معروف</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{summary.unknownTags}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400">مفقود</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">{summary.missingItems}</p>
            </div>
          </div>

          {/* Results Table */}
          {summary.results?.length > 0 && (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-right text-sm">
                <thead className="sticky top-0 bg-white dark:bg-gray-900">
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">التاج</th>
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">المنتج</th>
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">الموقع الممسوح</th>
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">الموقع المتوقع</th>
                    <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">النتيجة</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.results.map((r: any) => {
                    const rt = resultTypeLabel(r.resultType);
                    return (
                      <tr key={r.id} className="border-b border-gray-50 dark:border-gray-800">
                        <td className="py-2 px-3 font-mono text-xs">{r.rfidTagId}</td>
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{r.productName ?? '—'}</td>
                        <td className="py-2 px-3 font-mono text-xs text-gray-500">{r.scannedLocation ?? '—'}</td>
                        <td className="py-2 px-3 font-mono text-xs text-gray-500">{r.expectedLocation ?? '—'}</td>
                        <td className="py-2 px-3"><Badge variant={rt.variant}>{rt.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab 4: Reports
// ═══════════════════════════════════════════════════════════

function ReportsTab() {
  const { data: tagsRes } = useQuery({
    queryKey: ['rfid-tags'],
    queryFn: () => rfidInventoryApi.getTags(),
  });

  const { data: sessionsRes } = useQuery({
    queryKey: ['rfid-sessions'],
    queryFn: () => rfidInventoryApi.getSessions({ page: 1, pageSize: 100 }),
  });

  const tags = tagsRes?.data ?? [];
  const sessions = sessionsRes?.data?.items ?? [];

  const completedSessions = sessions.filter((s: any) => s.status === 'Completed');
  const lastSession = completedSessions[0];

  const totalScanned = completedSessions.reduce((sum: number, s: any) => sum + s.totalTagsScanned, 0);
  const totalMatched = completedSessions.reduce((sum: number, s: any) => sum + s.matchedItems, 0);
  const totalMissing = completedSessions.reduce((sum: number, s: any) => sum + s.missingItems, 0);
  const discrepancyRate = totalScanned > 0 ? (((totalScanned - totalMatched) / totalScanned) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-l from-brand-50 to-white dark:from-brand-950 dark:to-gray-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Tag size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي التاجات</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tags.length}</p>
        </div>

        <div className="card p-5 bg-gradient-to-l from-emerald-50 to-white dark:from-emerald-950 dark:to-gray-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ClipboardList size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">جلسات مكتملة</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completedSessions.length}</p>
        </div>

        <div className="card p-5 bg-gradient-to-l from-amber-50 to-white dark:from-amber-950 dark:to-gray-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BarChart3 size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">نسبة التباين</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{discrepancyRate}%</p>
        </div>

        <div className="card p-5 bg-gradient-to-l from-red-50 to-white dark:from-red-950 dark:to-gray-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertCircle size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">مفقودات إجمالية</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalMissing}</p>
        </div>
      </div>

      {/* Last Scan Info */}
      <div className="card p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">آخر جلسة جرد</h3>
        {lastSession ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">رقم الجلسة</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">#{lastSession.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">المخزن</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{lastSession.warehouseName ?? `#${lastSession.warehouseId}`}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">تاريخ الجرد</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {new Date(lastSession.startedAt).toLocaleDateString('ar-SA')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">النتيجة</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {lastSession.matchedItems} مطابق / {lastSession.missingItems} مفقود
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">لم يتم إجراء أي جلسة جرد بعد</p>
        )}
      </div>

      {/* Recent Sessions Table */}
      {completedSessions.length > 0 && (
        <div className="card p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">سجل الجلسات المكتملة</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">#</th>
                  <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">المخزن</th>
                  <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">النوع</th>
                  <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">التاريخ</th>
                  <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">ممسوح</th>
                  <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">مطابق</th>
                  <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">مفقود</th>
                </tr>
              </thead>
              <tbody>
                {completedSessions.slice(0, 10).map((s: any) => (
                  <tr key={s.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2 px-3 font-mono text-gray-900 dark:text-gray-100">{s.id}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{s.warehouseName ?? '—'}</td>
                    <td className="py-2 px-3 text-gray-500">{s.sessionType}</td>
                    <td className="py-2 px-3 text-gray-500">{new Date(s.startedAt).toLocaleDateString('ar-SA')}</td>
                    <td className="py-2 px-3 font-bold text-gray-900 dark:text-gray-100">{s.totalTagsScanned}</td>
                    <td className="py-2 px-3 font-bold text-emerald-600">{s.matchedItems}</td>
                    <td className="py-2 px-3 font-bold text-red-600">{s.missingItems}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
