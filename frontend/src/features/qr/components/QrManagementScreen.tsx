import { useState } from 'react';
import {
  QrCode, Plus, Edit2, Trash2, RefreshCw, Copy, ExternalLink,
  Table2, Eye, EyeOff, Smartphone, Palette, Globe, CreditCard,
  Banknote, Shield, Users, Settings2, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import {
  useQrConfigs, useSaveQrConfig, useDeleteQrConfig, useRegenerateQrCode, useTables,
} from '@/hooks/useApi';

const sessionTypeLabels: Record<string, string> = {
  DineIn: 'محلي', TakeAway: 'تيك اواي', Delivery: 'توصيل', Remote: 'عن بُعد',
};

export default function QrManagementScreen() {
  const { data: configsRes, isLoading } = useQrConfigs();
  const saveMut = useSaveQrConfig();
  const deleteMut = useDeleteQrConfig();
  const regenerateMut = useRegenerateQrCode();
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const configs = configsRes?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-xl"><QrCode size={24} className="text-violet-600" /></div>
            إدارة QR Code للعملاء
          </h1>
          <p className="text-sm text-gray-500 mt-1">أنشئ أكواد QR ليتمكن العملاء من تصفح المنيو والطلب مباشرة</p>
        </div>
        <button onClick={() => { setEditingConfig(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition font-medium">
          <Plus size={18} /> إنشاء كود QR
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-l from-violet-50 to-indigo-50 rounded-xl p-5 border border-violet-200">
        <div className="flex items-start gap-3">
          <Smartphone size={24} className="text-violet-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-violet-900">كيف يعمل النظام؟</h3>
            <div className="text-sm text-violet-700 mt-1 space-y-1">
              <p>1. أنشئ كود QR لكل طاولة أو للمتجر ككل</p>
              <p>2. العميل يمسح الكود بكاميرا الموبايل → تفتح المنيو مباشرة</p>
              <p>3. يختار الأصناف ويضيف ملاحظات → يرسل الطلب</p>
              <p>4. يختار طريقة الدفع → يتابع حالة الطلب بعداد مباشر</p>
              <p>5. الطلب يظهر مباشرة في شاشة المطبخ + واجهة الويتر</p>
            </div>
          </div>
        </div>
      </div>

      {/* Configs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : configs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border">
          <QrCode size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد أكواد QR</h3>
          <p className="text-sm text-gray-500 mb-4">أنشئ أول كود QR لتمكين العملاء من الطلب الذاتي</p>
          <button onClick={() => { setEditingConfig(null); setShowForm(true); }}
            className="px-6 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition">
            <Plus size={16} className="inline ml-1" /> إنشاء كود
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map((config: any) => (
            <QrConfigCard
              key={config.id}
              config={config}
              onEdit={() => { setEditingConfig(config); setShowForm(true); }}
              onDelete={() => { if (confirm('حذف هذا الكود؟')) deleteMut.mutate(config.id); }}
              onRegenerate={() => { if (confirm('إعادة توليد الكود؟ الرابط القديم سيتوقف عن العمل')) regenerateMut.mutate(config.id); }}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <QrConfigFormModal
          config={editingConfig}
          onClose={() => { setShowForm(false); setEditingConfig(null); }}
          onSave={(data: any) => saveMut.mutate({ id: editingConfig?.id, data }, { onSuccess: () => { setShowForm(false); setEditingConfig(null); } })}
          saving={saveMut.isPending}
        />
      )}
    </div>
  );
}

// ── QR Config Card ──

function QrConfigCard({ config, onEdit, onDelete, onRegenerate }: {
  config: any; onEdit: () => void; onDelete: () => void; onRegenerate: () => void;
}) {
  const copyLink = () => {
    const url = `${window.location.origin}/order/${config.code}`;
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ الرابط');
  };

  const orderUrl = `${window.location.origin}/order/${config.code}`;

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 transition-all hover:shadow-md ${!config.isActive ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: config.themeColor }}>
            QR
          </div>
          <div>
            <h3 className="font-bold text-gray-900">
              {config.tableNumber ? `طاولة ${config.tableNumber}` : 'كود عام'}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${config.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {config.isActive ? 'مفعّل' : 'معطّل'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Edit2 size={14} /></button>
          <button onClick={onRegenerate} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"><RefreshCw size={14} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-1.5 mb-4">
        <div className="flex items-center gap-1.5"><Globe size={12} /> نوع: {sessionTypeLabels[config.defaultType] || config.defaultType}</div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {config.allowCashPayment && <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded"><Banknote size={10} className="inline ml-0.5" /> كاش</span>}
          {config.allowOnlinePayment && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded"><CreditCard size={10} className="inline ml-0.5" /> أونلاين</span>}
          {config.requirePhone && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded"><Shield size={10} className="inline ml-0.5" /> جوال مطلوب</span>}
        </div>
        {config.serviceChargePercent > 0 && (
          <div>رسوم خدمة: {config.serviceChargePercent}%</div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium hover:bg-violet-100 transition">
          <Copy size={12} /> نسخ الرابط
        </button>
        <a href={orderUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition">
          <ExternalLink size={12} /> معاينة
        </a>
      </div>

      <div className="mt-2 text-[10px] text-gray-400 truncate text-center">{config.code}</div>
    </div>
  );
}

// ── QR Config Form Modal ──

function QrConfigFormModal({ config, onClose, onSave, saving }: {
  config: any; onClose: () => void; onSave: (data: any) => void; saving: boolean;
}) {
  const { data: tablesRes } = useTables();
  const tables = tablesRes?.data ?? [];

  const [form, setForm] = useState({
    tableId: config?.tableId || null,
    branchId: config?.branchId || null,
    defaultType: config?.defaultType || 'DineIn',
    isActive: config?.isActive ?? true,
    allowRemoteOrder: config?.allowRemoteOrder ?? true,
    requirePhone: config?.requirePhone ?? true,
    allowCashPayment: config?.allowCashPayment ?? true,
    allowOnlinePayment: config?.allowOnlinePayment ?? true,
    serviceChargePercent: config?.serviceChargePercent ?? null,
    welcomeMessage: config?.welcomeMessage || '',
    logoUrl: config?.logoUrl || '',
    themeColor: config?.themeColor || '#6366f1',
  });

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#1e293b'];

  return (
    <Modal open onClose={onClose} title={config ? 'تعديل كود QR' : 'إنشاء كود QR جديد'}>
      <div className="space-y-5 max-h-[70vh] overflow-y-auto px-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ربط بطاولة</label>
            <select value={form.tableId || ''} onChange={e => setForm(f => ({ ...f, tableId: e.target.value ? parseInt(e.target.value) : null }))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm">
              <option value="">كود عام (بدون طاولة)</option>
              {tables.map((t: any) => <option key={t.id} value={t.id}>{t.tableNumber} - {t.section || 'عام'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع الطلب الافتراضي</label>
            <select value={form.defaultType} onChange={e => setForm(f => ({ ...f, defaultType: e.target.value }))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm">
              <option value="DineIn">محلي (داخل المتجر)</option>
              <option value="TakeAway">تيك اواي</option>
              <option value="Delivery">توصيل</option>
              <option value="Remote">عن بُعد</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">رسالة ترحيب</label>
          <input value={form.welcomeMessage} onChange={e => setForm(f => ({ ...f, welcomeMessage: e.target.value }))}
            placeholder="أهلاً وسهلاً! اختر طلبك من المنيو" className="w-full px-3 py-2.5 border rounded-xl text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">لون الثيم</label>
          <div className="flex gap-2 flex-wrap">
            {colors.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, themeColor: c }))}
                className={`w-8 h-8 rounded-full transition-all ${form.themeColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: 'isActive', label: 'مفعّل', Icon: Eye },
            { key: 'allowRemoteOrder', label: 'طلب عن بُعد', Icon: Globe },
            { key: 'requirePhone', label: 'جوال مطلوب', Icon: Shield },
            { key: 'allowCashPayment', label: 'دفع كاش', Icon: Banknote },
            { key: 'allowOnlinePayment', label: 'دفع أونلاين', Icon: CreditCard },
          ].map(({ key, label, Icon }) => (
            <button key={key} type="button"
              onClick={() => setForm(f => ({ ...f, [key]: !(f as any)[key] }))}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition ${(form as any)[key] ? 'bg-violet-50 border-violet-300 text-violet-700 font-medium' : 'bg-white border-gray-200 text-gray-500'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رسوم خدمة (%)</label>
            <input type="number" min={0} max={50} step={0.5}
              value={form.serviceChargePercent ?? ''} onChange={e => setForm(f => ({ ...f, serviceChargePercent: e.target.value ? Number(e.target.value) : null }))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رابط الشعار</label>
            <input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm" placeholder="https://..." />
          </div>
        </div>

        <div className="flex gap-3 pt-3 border-t">
          <button onClick={() => onSave(form)} disabled={saving}
            className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition disabled:opacity-50">
            {saving ? 'جارٍ الحفظ...' : config ? 'تحديث' : 'إنشاء'}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">إلغاء</button>
        </div>
      </div>
    </Modal>
  );
}
